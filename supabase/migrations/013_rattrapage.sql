-- ════════════════════════════════════════════════════════════
-- 013_rattrapage.sql — Session de rattrapage (2e tentative) des examens
--   • exam_attempts : colonne session (1 = normale, 2 = rattrapage) + is_resit
--   • unicité (exam_id, student_id) → (exam_id, student_id, session)
--   • exams : ouverture du rattrapage + règle de note retenue ('best' | 'last')
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- 1. Tentatives : numéro de session + marqueur rattrapage
alter table public.exam_attempts
  add column if not exists session int not null default 1,
  add column if not exists is_resit boolean default false;

-- 2. Remplace la contrainte unique (exam_id, student_id) — nommée
--    exam_attempts_exam_id_student_id_key par Postgres (cf. schema.sql :
--    unique (exam_id, student_id)) — par (exam_id, student_id, session).
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'exam_attempts_exam_id_student_id_key'
      and conrelid = 'public.exam_attempts'::regclass
  ) then
    alter table public.exam_attempts
      drop constraint exam_attempts_exam_id_student_id_key;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'exam_attempts_exam_student_session_key'
      and conrelid = 'public.exam_attempts'::regclass
  ) then
    alter table public.exam_attempts
      add constraint exam_attempts_exam_student_session_key
      unique (exam_id, student_id, session);
  end if;
end $$;

-- 3. Examens : pilotage du rattrapage par l'enseignant
alter table public.exams
  add column if not exists resit_open boolean default false,
  add column if not exists resit_scheduled_at timestamptz,
  add column if not exists resit_rule text default 'best';   -- 'best' | 'last'
