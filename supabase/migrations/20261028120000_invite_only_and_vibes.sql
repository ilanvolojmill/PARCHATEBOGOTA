-- Categorías Pre/Chill/Formal/Foodies y planes "Por invitación".
-- Obligatorio en producción. Aplicar DESPUÉS de las migraciones anteriores.

-- 1) Nuevas categorías (Pre, Chill, Formal, Foodies)
alter table public.parches drop constraint if exists parches_vibe_check;
alter table public.parches add constraint parches_vibe_check
  check (vibe in ('rumba','rooftop','after','cultural','picnic','pre','chill','formal','foodies'));

alter table public.spots drop constraint if exists spots_vibe_check;
alter table public.spots add constraint spots_vibe_check
  check (vibe in ('rumba','rooftop','after','cultural','picnic','pre','chill','formal','foodies'));

-- 2) Plan privado / por invitación
alter table public.parches add column if not exists invite_only boolean not null default false;
alter table public.spots   add column if not exists invite_only boolean not null default false;

-- 3) Solicitudes de invitación (mensaje de máx. 20 palabras validado también en servidor)
create table if not exists public.invite_requests (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('parche','spot')),
  target_id uuid not null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '' check (char_length(message) <= 300),
  status text not null default 'pending' check (status in ('pending','accepted','denied')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (target_type, target_id, requester_id),
  check (host_id <> requester_id)
);

alter table public.invite_requests enable row level security;

-- El solicitante y el anfitrión ven la solicitud
create policy invite_requests_select on public.invite_requests
  for select using (auth.uid() = requester_id or auth.uid() = host_id);

-- Solo el solicitante crea su solicitud (siempre pendiente)
create policy invite_requests_insert on public.invite_requests
  for insert with check (auth.uid() = requester_id and status = 'pending');

-- Solo el anfitrión decide
create policy invite_requests_update on public.invite_requests
  for update using (auth.uid() = host_id) with check (auth.uid() = host_id);

-- Hilo de chat asociado (se crea al pedir invitación)
alter table public.invite_requests
  add column if not exists thread_id uuid references public.dm_threads(id) on delete set null;

create index if not exists invite_requests_host_idx on public.invite_requests(host_id, status);
create index if not exists invite_requests_requester_idx on public.invite_requests(requester_id, status);

-- Realtime: solicitudes entre anfitrión y solicitante
do $$
begin
  alter publication supabase_realtime add table public.invite_requests;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
