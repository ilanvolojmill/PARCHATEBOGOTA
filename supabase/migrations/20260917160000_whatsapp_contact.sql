-- WhatsApp de contacto en parches y spots
alter table public.parches
  add column if not exists whatsapp text;

alter table public.spots
  add column if not exists whatsapp text;
