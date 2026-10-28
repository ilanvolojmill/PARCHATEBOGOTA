-- Identidad KYC (cédula) vía proveedor externo. El cliente NUNCA escribe estos campos.
alter table public.profiles
  add column if not exists identity_status text not null default 'none'
    check (identity_status in ('none', 'pending', 'verified', 'rejected')),
  add column if not exists identity_provider text,
  add column if not exists identity_verification_id text,
  add column if not exists identity_verified_at timestamptz,
  add column if not exists identity_rejection_reason text;

create table if not exists public.kyc_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  external_id text,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kyc_sessions_user_idx on public.kyc_sessions(user_id);

alter table public.kyc_sessions enable row level security;

create policy "kyc_sessions_own_read" on public.kyc_sessions
  for select using (auth.uid() = user_id);

-- Endurecer: identity_* solo vía service role / RPC webhook
create or replace function public.protect_identity_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and auth.role() = 'authenticated' then
    if new.identity_status is distinct from old.identity_status
       or new.identity_provider is distinct from old.identity_provider
       or new.identity_verification_id is distinct from old.identity_verification_id
       or new.identity_verified_at is distinct from old.identity_verified_at
       or new.identity_rejection_reason is distinct from old.identity_rejection_reason then
      raise exception 'Los campos de identidad solo se actualizan vía KYC webhook';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_identity_fields on public.profiles;
create trigger protect_identity_fields
  before update on public.profiles
  for each row execute function public.protect_identity_fields();

-- El usuario solo puede pasar a pending al iniciar sesión KYC (no a verified)
create or replace function public.start_identity_verification(p_provider text, p_external_id text default null)
returns public.kyc_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.kyc_sessions;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  insert into public.kyc_sessions (user_id, provider, external_id, status)
  values (auth.uid(), coalesce(nullif(p_provider, ''), 'pending_config'), p_external_id, 'pending')
  returning * into s;

  update public.profiles
  set identity_status = 'pending',
      identity_provider = s.provider,
      identity_verification_id = s.id::text
  where id = auth.uid();

  return s;
end;
$$;

grant execute on function public.start_identity_verification(text, text) to authenticated;
