-- ════════════════════════════════════════════════════════════
-- 020_rooms.sql — Salles & réservations (chantier E2)
--   • rooms : salles physiques (salle | amphi | labo)
--   • room_bookings : réservations hebdo ou ponctuelles
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  capacity   int,
  kind       text default 'salle',      -- 'salle' | 'amphi' | 'labo'
  campus     text,
  active     boolean default true,
  created_at timestamptz default now()
);
alter table public.rooms enable row level security;
drop policy if exists "rooms_all" on public.rooms;
create policy "rooms_all" on public.rooms for all using (true) with check (true);

create table if not exists public.room_bookings (
  id                uuid primary key default gen_random_uuid(),
  room_id           uuid references public.rooms(id) on delete cascade,
  program_course_id uuid,
  title             text,
  day               int,                -- 0=lundi..5=samedi pour hebdo, null si ponctuel
  starts_at         timestamptz,
  ends_at           timestamptz,
  start_time        text,               -- "HH:MM" (hebdo)
  end_time          text,               -- "HH:MM" (hebdo)
  weekly            boolean default true,
  booked_by         uuid,
  created_at        timestamptz default now()
);
create index if not exists idx_room_bookings_room on public.room_bookings(room_id);
create index if not exists idx_room_bookings_day on public.room_bookings(day);
alter table public.room_bookings enable row level security;
drop policy if exists "room_bookings_all" on public.room_bookings;
create policy "room_bookings_all" on public.room_bookings for all using (true) with check (true);
