-- ════════════════════════════════════════════════════════════
-- 009_live_tracking.sql — Lives : durée, délais, présence auto,
--                          cahier de texte enseignant
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- 1. Paramètres des lives, préconfigurés PAR COURS par l'enseignant
alter table public.program_courses
  add column if not exists live_duration_min int not null default 60,        -- durée d'un cours live
  add column if not exists live_max_join_delay_min int not null default 15,  -- retard max de connexion étudiant
  add column if not exists live_min_stay_min int not null default 30;        -- présence minimale avant sortie

-- 2. Journal de connexion aux lives (étudiants ET enseignants)
create table if not exists public.live_attendance (
  id         uuid primary key default gen_random_uuid(),
  live_id    uuid not null references public.lives(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       text not null default 'etudiant',
  joined_at  timestamptz not null default now(),
  left_at    timestamptz,
  unique (live_id, user_id)
);
create index if not exists idx_la_live on public.live_attendance(live_id);
create index if not exists idx_la_user on public.live_attendance(user_id);
alter table public.live_attendance enable row level security;
drop policy if exists "live_attendance_all" on public.live_attendance;
create policy "live_attendance_all" on public.live_attendance for all using (true) with check (true);

-- 3. Cahier de texte (journal pédagogique du cours, tenu par l'enseignant)
create table if not exists public.cahier_texte (
  id                 uuid primary key default gen_random_uuid(),
  program_course_id  uuid not null references public.program_courses(id) on delete cascade,
  entry_date         date not null default current_date,
  content            text not null,          -- ce qui a été fait en séance
  homework           text,                   -- travail à faire
  duration_min       int not null default 60,-- durée de la séance
  created_by         uuid references public.users(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index if not exists idx_ct_course on public.cahier_texte(program_course_id);
alter table public.cahier_texte enable row level security;
drop policy if exists "cahier_texte_all" on public.cahier_texte;
create policy "cahier_texte_all" on public.cahier_texte for all using (true) with check (true);
