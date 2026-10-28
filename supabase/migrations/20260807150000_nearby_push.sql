-- Nearby push + retención selfies + last location
alter table public.profiles
  add column if not exists last_lat double precision,
  add column if not exists last_lng double precision,
  add column if not exists last_location_at timestamptz;

-- Retención: borrar selfies de cuentas sin actividad > 365 días (ejecutar vía cron opcional)
create or replace function public.purge_stale_face_photos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
begin
  -- Solo service role debería llamarlo. No borramos auth; solo limpia URLs viejas sin uso.
  update public.profiles
  set face_photo_url = null
  where face_photo_url is not null
    and coalesce(last_location_at, created_at) < now() - interval '365 days'
    and verified = false;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Actualizar ubicación propia (para nearby)
create or replace function public.update_my_location(p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  update public.profiles
  set last_lat = p_lat, last_lng = p_lng, last_location_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.update_my_location(double precision, double precision) to authenticated;

-- Haversine helper (km)
create or replace function public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql immutable as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;
