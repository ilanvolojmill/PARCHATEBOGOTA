-- ParchexBogotá — migración producción completa
-- Ejecutar con: supabase db push  OR  pegar en SQL Editor

create extension if not exists "pgcrypto";

-- Perfiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  name text not null,
  bio text default '',
  avatar_url text,
  face_photo_url text,
  verified boolean default false,
  verified_at timestamptz,
  verification_id text,
  is_admin boolean default false,
  is_banned boolean default false,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists onboarding_completed boolean default false;

-- Parches
create table if not exists public.parches (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  photo_url text not null,
  lat double precision not null,
  lng double precision not null,
  address text,
  neighborhood text,
  vibe text not null check (vibe in ('rumba','rooftop','after','cultural','picnic')),
  expires_at timestamptz not null,
  hidden boolean default false,
  created_at timestamptz default now()
);

create index if not exists parches_expires_idx on public.parches(expires_at);
create index if not exists parches_neighborhood_idx on public.parches(neighborhood);

-- Spots
create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  photo_url text not null,
  lat double precision not null,
  lng double precision not null,
  neighborhood text not null,
  vibe text not null check (vibe in ('rumba','rooftop','after','cultural','picnic')),
  hidden boolean default false,
  created_at timestamptz default now()
);

-- Comentarios
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('parche','spot')),
  target_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);
create index if not exists comments_target_idx on public.comments(target_type, target_id);

-- DM
create table if not exists public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  parche_id uuid references public.parches(id) on delete set null,
  spot_id uuid references public.spots(id) on delete set null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  guest_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  created_at timestamptz default now(),
  unique (parche_id, guest_id),
  unique (spot_id, guest_id)
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists dm_messages_thread_idx on public.dm_messages(thread_id);

create table if not exists public.going_entries (
  parche_id uuid not null references public.parches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (parche_id, user_id)
);

create table if not exists public.checkins (
  parche_id uuid not null references public.parches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (parche_id, user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('parche','spot','user')),
  target_id text not null,
  target_label text not null,
  reason text not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending','reviewed','dismissed')),
  created_at timestamptz default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_handle text not null,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_handle)
);

create table if not exists public.user_spot_prefs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  spot_id uuid not null references public.spots(id) on delete cascade,
  status text not null check (status in ('saved','discarded')),
  created_at timestamptz default now(),
  primary key (user_id, spot_id)
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('web','ios','android')),
  created_at timestamptz default now(),
  unique (user_id, token)
);

-- Trigger nuevo usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 8) || '.bog',
    coalesce(new.raw_user_meta_data->>'name', 'Parcero')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Helper admin
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.parches enable row level security;
alter table public.spots enable row level security;
alter table public.comments enable row level security;
alter table public.dm_threads enable row level security;
alter table public.dm_messages enable row level security;
alter table public.going_entries enable row level security;
alter table public.checkins enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.user_spot_prefs enable row level security;
alter table public.push_tokens enable row level security;

-- Drop old policies if re-running
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
  execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Profiles
create policy "profiles_read" on public.profiles for select using (not is_banned);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin_update" on public.profiles for update using (public.is_admin());

-- Parches
create policy "parches_read" on public.parches for select using (not hidden and expires_at > now());
create policy "parches_insert" on public.parches for insert with check (auth.uid() = host_id);
create policy "parches_update_own" on public.parches for update using (auth.uid() = host_id);
create policy "parches_delete_own" on public.parches for delete using (auth.uid() = host_id);
create policy "parches_admin" on public.parches for all using (public.is_admin());

-- Spots
create policy "spots_read" on public.spots for select using (not hidden);
create policy "spots_insert" on public.spots for insert with check (auth.uid() = host_id);
create policy "spots_update_own" on public.spots for update using (auth.uid() = host_id);
create policy "spots_delete_own" on public.spots for delete using (auth.uid() = host_id);
create policy "spots_admin" on public.spots for all using (public.is_admin());

-- Comments
create policy "comments_read" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = author_id);

-- DM
create policy "dm_threads_read" on public.dm_threads for select using (auth.uid() = host_id or auth.uid() = guest_id);
create policy "dm_threads_insert" on public.dm_threads for insert with check (auth.uid() = guest_id or auth.uid() = host_id);
create policy "dm_messages_read" on public.dm_messages for select using (
  exists (select 1 from public.dm_threads t where t.id = thread_id and (t.host_id = auth.uid() or t.guest_id = auth.uid()))
);
create policy "dm_messages_insert" on public.dm_messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.dm_threads t where t.id = thread_id and (t.host_id = auth.uid() or t.guest_id = auth.uid())
  )
);
create policy "dm_messages_update_read" on public.dm_messages for update using (
  exists (select 1 from public.dm_threads t where t.id = thread_id and (t.host_id = auth.uid() or t.guest_id = auth.uid()))
);

-- Going & checkins
create policy "going_read" on public.going_entries for select using (true);
create policy "going_write" on public.going_entries for insert with check (auth.uid() = user_id);
create policy "going_delete" on public.going_entries for delete using (auth.uid() = user_id);
create policy "checkins_read" on public.checkins for select using (true);
create policy "checkins_write" on public.checkins for insert with check (auth.uid() = user_id);
create policy "checkins_delete" on public.checkins for delete using (auth.uid() = user_id);

-- Reports
create policy "reports_insert" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "reports_admin_read" on public.reports for select using (public.is_admin());
create policy "reports_admin_update" on public.reports for update using (public.is_admin());

-- Blocks, prefs, push
create policy "blocks_own" on public.blocks for all using (auth.uid() = blocker_id);
create policy "spot_prefs_own" on public.user_spot_prefs for all using (auth.uid() = user_id);
create policy "push_tokens_own" on public.push_tokens for all using (auth.uid() = user_id);

-- Storage bucket photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;

-- Storage policies
drop policy if exists "photos_public_read" on storage.objects;
drop policy if exists "photos_auth_upload" on storage.objects;
drop policy if exists "photos_auth_update" on storage.objects;
drop policy if exists "photos_auth_delete" on storage.objects;

create policy "photos_public_read" on storage.objects for select using (bucket_id = 'photos');
create policy "photos_auth_insert" on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "photos_auth_update" on storage.objects for update to authenticated using (bucket_id = 'photos');
create policy "photos_auth_delete" on storage.objects for delete to authenticated using (bucket_id = 'photos');

-- Habilitar Realtime en Dashboard → Database → Replication para:
-- parches, spots, comments, dm_messages, going_entries, checkins
