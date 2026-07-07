-- ════════════════════════════════════════════════════════════
-- 022_cohorts.sql — Promotions & cohortes (chantier E4)
--   • cohorts        : regroupement filière + niveau + année
--   • cohort_members : étudiants rattachés à une cohorte
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create table if not exists public.cohorts (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  parcours_slug  text,
  parcours_title text,
  academic_year text,
  level         text,                    -- L1..M2
  created_at    timestamptz default now(),
  created_by    uuid
);
alter table public.cohorts enable row level security;
drop policy if exists "cohorts_all" on public.cohorts;
create policy "cohorts_all" on public.cohorts for all using (true) with check (true);

create table if not exists public.cohort_members (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid references public.cohorts(id) on delete cascade,
  student_id uuid not null,
  added_at   timestamptz default now(),
  unique(cohort_id, student_id)
);
create index if not exists idx_cohort_members_cohort on public.cohort_members(cohort_id);
create index if not exists idx_cohort_members_student on public.cohort_members(student_id);
alter table public.cohort_members enable row level security;
drop policy if exists "cohort_members_all" on public.cohort_members;
create policy "cohort_members_all" on public.cohort_members for all using (true) with check (true);
