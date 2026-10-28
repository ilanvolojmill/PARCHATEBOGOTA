-- ParchexBogotá — hardening producción
-- Seguridad RLS, storage, rate limits, age gate, delete account

-- Age confirmation
alter table public.profiles
  add column if not exists age_confirmed boolean default false;

-- Rate limit log
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  created_at timestamptz default now()
);
create index if not exists rate_limits_user_action_idx
  on public.rate_limits(user_id, action, created_at desc);

alter table public.rate_limits enable row level security;
drop policy if exists "rate_limits_own" on public.rate_limits;
create policy "rate_limits_own" on public.rate_limits
  for select using (auth.uid() = user_id);

-- Impedir escalada de privilegios en update propio
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    if new.is_admin is distinct from old.is_admin then
      raise exception 'No puedes cambiar is_admin';
    end if;
    if new.is_banned is distinct from old.is_banned then
      raise exception 'No puedes cambiar is_banned';
    end if;
    if new.verified is distinct from old.verified
       or new.verified_at is distinct from old.verified_at
       or new.verification_id is distinct from old.verification_id then
      raise exception 'Usa confirm_profile_selfie() para el sello de selfie';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Selfie confirmada (NO es KYC gubernamental). Solo si hay foto de rostro.
create or replace function public.confirm_profile_selfie()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select * into p from public.profiles where id = auth.uid();
  if p.face_photo_url is null or length(trim(p.face_photo_url)) = 0 then
    raise exception 'Sube una selfie antes de confirmar';
  end if;

  update public.profiles
  set
    verified = true,
    verified_at = now(),
    verification_id = coalesce(verification_id, 'selfie_' || substr(id::text, 1, 8))
  where id = auth.uid()
  returning * into p;

  return p;
end;
$$;

grant execute on function public.confirm_profile_selfie() to authenticated;

-- Rate limit helper
create or replace function public.check_rate_limit(
  p_action text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt int;
begin
  if auth.uid() is null then
    return false;
  end if;

  select count(*) into cnt
  from public.rate_limits
  where user_id = auth.uid()
    and action = p_action
    and created_at > now() - make_interval(secs => p_window_seconds);

  if cnt >= p_max then
    return false;
  end if;

  insert into public.rate_limits(user_id, action) values (auth.uid(), p_action);
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to authenticated;

-- Eliminar cuenta (perfil + auth user vía cascade profiles; auth requiere service o RPC)
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  delete from storage.objects
  where bucket_id in ('photos', 'faces')
    and (name like 'avatars/' || uid::text || '%'
      or name like 'faces/' || uid::text || '%'
      or name like 'parches/' || uid::text || '/%'
      or name like 'spots/' || uid::text || '/%');

  delete from public.profiles where id = uid;
  -- Nota: borrar auth.users requiere service role en Edge Function; ver docs.
end;
$$;

grant execute on function public.delete_own_account() to authenticated;

-- Comments: autor puede borrar los suyos; admin todos
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = author_id or public.is_admin());

-- Storage: bucket faces privado
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('faces', 'faces', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 3145728;

-- Endurecer policies photos (paths por usuario)
drop policy if exists "photos_public_read" on storage.objects;
drop policy if exists "photos_auth_insert" on storage.objects;
drop policy if exists "photos_auth_update" on storage.objects;
drop policy if exists "photos_auth_delete" on storage.objects;
drop policy if exists "photos_auth_upload" on storage.objects;

create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'photos');

create policy "photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (
      name like 'avatars/' || auth.uid()::text || '%'
      or name like 'parches/' || auth.uid()::text || '/%'
      or name like 'spots/' || auth.uid()::text || '/%'
    )
  );

create policy "photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'photos'
    and (
      name like 'avatars/' || auth.uid()::text || '%'
      or name like 'parches/' || auth.uid()::text || '/%'
      or name like 'spots/' || auth.uid()::text || '/%'
    )
  );

create policy "photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and (
      name like 'avatars/' || auth.uid()::text || '%'
      or name like 'parches/' || auth.uid()::text || '/%'
      or name like 'spots/' || auth.uid()::text || '/%'
    )
  );

-- Faces: solo el dueño lee/escribe
drop policy if exists "faces_select_own" on storage.objects;
drop policy if exists "faces_insert_own" on storage.objects;
drop policy if exists "faces_update_own" on storage.objects;
drop policy if exists "faces_delete_own" on storage.objects;

create policy "faces_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'faces' and name like auth.uid()::text || '/%');

create policy "faces_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'faces' and name like auth.uid()::text || '/%');

create policy "faces_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'faces' and name like auth.uid()::text || '/%');

create policy "faces_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'faces' and name like auth.uid()::text || '/%');
