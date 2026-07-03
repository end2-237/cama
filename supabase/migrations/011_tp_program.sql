-- ════════════════════════════════════════════════════════════
-- 011_tp_program.sql — TP programmés par l'enseignant dans le cours
--   machine attribuée + liste d'activités + sessions de travail
--   étudiant + progression + appréciation/note du prof
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- 1. TP programmé dans un cours (par l'enseignant)
create table if not exists public.course_tps (
  id                 uuid primary key default gen_random_uuid(),
  program_course_id  uuid not null references public.program_courses(id) on delete cascade,
  machine_id         uuid references public.remote_machines(id) on delete set null,
  title              text not null,
  description        text,
  activities         jsonb not null default '[]',   -- ["Installer nginx", "Configurer…", …]
  status             text not null default 'ferme', -- ferme | ouvert | termine
  created_by         uuid references public.users(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index if not exists idx_ctp_course on public.course_tps(program_course_id);
alter table public.course_tps enable row level security;
drop policy if exists "course_tps_all" on public.course_tps;
create policy "course_tps_all" on public.course_tps for all using (true) with check (true);

-- 2. Sessions de travail d'un étudiant sur un TP (chaque connexion machine)
create table if not exists public.tp_sessions (
  id          uuid primary key default gen_random_uuid(),
  tp_id       uuid not null references public.course_tps(id) on delete cascade,
  student_id  uuid not null references public.users(id) on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  report      text                                   -- compte-rendu / traces de la session
);
create index if not exists idx_tps_tp on public.tp_sessions(tp_id);
create index if not exists idx_tps_student on public.tp_sessions(student_id);
alter table public.tp_sessions enable row level security;
drop policy if exists "tp_sessions_all" on public.tp_sessions;
create policy "tp_sessions_all" on public.tp_sessions for all using (true) with check (true);

-- 3. Progression : activités cochées par l'étudiant
create table if not exists public.tp_progress (
  tp_id       uuid not null references public.course_tps(id) on delete cascade,
  student_id  uuid not null references public.users(id) on delete cascade,
  done        jsonb not null default '[]',   -- indices des activités terminées [0,2,…]
  updated_at  timestamptz not null default now(),
  primary key (tp_id, student_id)
);
alter table public.tp_progress enable row level security;
drop policy if exists "tp_progress_all" on public.tp_progress;
create policy "tp_progress_all" on public.tp_progress for all using (true) with check (true);

-- 4. Appréciation et note du prof sur le travail d'un étudiant
create table if not exists public.tp_grades (
  tp_id        uuid not null references public.course_tps(id) on delete cascade,
  student_id   uuid not null references public.users(id) on delete cascade,
  note         numeric(4,2),                 -- /20
  appreciation text,
  graded_by    uuid references public.users(id) on delete set null,
  graded_at    timestamptz not null default now(),
  primary key (tp_id, student_id)
);
alter table public.tp_grades enable row level security;
drop policy if exists "tp_grades_all" on public.tp_grades;
create policy "tp_grades_all" on public.tp_grades for all using (true) with check (true);
