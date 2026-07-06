-- ════════════════════════════════════════════════════════════
-- 014_academic_structure.sql — Structure académique CAMA
--   • années académiques & semestres comme entités
--   • ledger ECTS (progression vers le diplôme, 180 ECTS)
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- 1. Années académiques
create table if not exists public.academic_years (
  id          uuid primary key default gen_random_uuid(),
  label       text unique not null,          -- ex. '2024-2025'
  starts_on   date,
  ends_on     date,
  is_current  boolean default false,
  created_at  timestamptz default now()
);
alter table public.academic_years enable row level security;
drop policy if exists "academic_years_all" on public.academic_years;
create policy "academic_years_all" on public.academic_years for all using (true) with check (true);

-- 2. Semestres rattachés à une année
create table if not exists public.semesters (
  id               uuid primary key default gen_random_uuid(),
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  number           int not null,             -- 1, 2…
  label            text,                     -- ex. 'Semestre 1'
  starts_on        date,
  ends_on          date,
  is_current       boolean default false
);
create index if not exists idx_semesters_year on public.semesters(academic_year_id);
alter table public.semesters enable row level security;
drop policy if exists "semesters_all" on public.semesters;
create policy "semesters_all" on public.semesters for all using (true) with check (true);

-- 3. Ledger ECTS — crédits obtenus par étudiant et par matière
create table if not exists public.ects_ledger (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null,
  program_course_id uuid,
  academic_year     text,                    -- ex. '2024-2025'
  semester          int,
  ects              int not null default 0,
  obtained          boolean not null default false,
  origin            text,                    -- ex. 'deliberation', 'equivalence'
  validated_at      timestamptz default now(),
  validated_by      uuid,
  unique (student_id, program_course_id)
);
create index if not exists idx_ects_student on public.ects_ledger(student_id);
alter table public.ects_ledger enable row level security;
drop policy if exists "ects_ledger_all" on public.ects_ledger;
create policy "ects_ledger_all" on public.ects_ledger for all using (true) with check (true);

-- 4. Seed doux : année courante 2024-2025 + 2 semestres (si absents)
insert into public.academic_years (label, starts_on, ends_on, is_current)
values ('2024-2025', '2024-10-01', '2025-07-31', true)
on conflict (label) do nothing;

insert into public.semesters (academic_year_id, number, label, starts_on, ends_on, is_current)
select y.id, 1, 'Semestre 1', '2024-10-01', '2025-02-15', true
from public.academic_years y
where y.label = '2024-2025'
  and not exists (select 1 from public.semesters s where s.academic_year_id = y.id and s.number = 1);

insert into public.semesters (academic_year_id, number, label, starts_on, ends_on, is_current)
select y.id, 2, 'Semestre 2', '2025-02-16', '2025-07-31', false
from public.academic_years y
where y.label = '2024-2025'
  and not exists (select 1 from public.semesters s where s.academic_year_id = y.id and s.number = 2);
