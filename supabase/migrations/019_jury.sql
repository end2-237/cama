-- ════════════════════════════════════════════════════════════
-- 019_jury.sql — Jury de semestre : sessions, membres, décisions
--   • jury_sessions   : une session de délibération par année/semestre/parcours
--   • jury_members    : composition du jury (président, membres…)
--   • jury_decisions  : décision par étudiant (moyenne, ECTS, compensation)
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create table if not exists public.jury_sessions (
  id             uuid primary key default gen_random_uuid(),
  academic_year  text,
  semester       int,
  parcours_slug  text,
  status         text default 'ouvert',        -- 'ouvert' | 'cloture'
  held_at        timestamptz default now(),
  created_by     uuid,
  closed_at      timestamptz
);
create index if not exists idx_jury_sessions_status on public.jury_sessions(status);
alter table public.jury_sessions enable row level security;
drop policy if exists "jury_sessions_all" on public.jury_sessions;
create policy "jury_sessions_all" on public.jury_sessions for all using (true) with check (true);

create table if not exists public.jury_members (
  id              uuid primary key default gen_random_uuid(),
  jury_session_id uuid references public.jury_sessions(id) on delete cascade,
  user_id         uuid,
  role_in_jury    text default 'membre'        -- 'president' | 'membre' | 'secretaire'
);
create index if not exists idx_jury_members_session on public.jury_members(jury_session_id);
alter table public.jury_members enable row level security;
drop policy if exists "jury_members_all" on public.jury_members;
create policy "jury_members_all" on public.jury_members for all using (true) with check (true);

create table if not exists public.jury_decisions (
  id                   uuid primary key default gen_random_uuid(),
  jury_session_id      uuid references public.jury_sessions(id) on delete cascade,
  student_id           uuid,
  average              numeric(4,2),
  ects_earned          int,
  decision             text,                   -- 'admis' | 'rattrapage' | 'ajourne'
  compensation_applied boolean default false,
  comment              text,
  unique(jury_session_id, student_id)
);
create index if not exists idx_jury_decisions_session on public.jury_decisions(jury_session_id);
alter table public.jury_decisions enable row level security;
drop policy if exists "jury_decisions_all" on public.jury_decisions;
create policy "jury_decisions_all" on public.jury_decisions for all using (true) with check (true);
