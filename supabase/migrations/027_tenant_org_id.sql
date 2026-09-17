-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Étape 2a — Colonne org_id sur toutes les tables métier
-- + backfill sur l'Institut JFN + fonctions d'aide RLS.
-- (Les policies restent inchangées ici ; la refonte RLS = Étape 2b.)
-- Idempotent : réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- ── 1. org_id sur chaque table métier + backfill + index ──
do $$
declare
  t text;
  jfn constant uuid := '00000000-0000-0000-0000-000000000001';
  tbls text[] := array[
    'users','inscriptions','program_courses','course_chapters','course_sessions',
    'chapter_progress','remote_machines','exams','exam_questions','exam_attempts',
    'deliberations','lives','academic_years','agent_tasks','attendance','audit_log',
    'cahier_texte','calendar_events','certification_enrollments','certifications',
    'cohort_members','cohorts','community_messages','course_chat','course_feedback',
    'course_notes','course_resources','course_tps','diplomas','dm_messages',
    'ects_ledger','extra_courses','extra_enrollments','fee_schedules','forum_messages',
    'internal_messages','invoices','journal_articles','journal_reactions',
    'jury_decisions','jury_members','jury_sessions','live_attendance','media_assets',
    'native_progress','notifications','payments','push_tokens','room_bookings','rooms',
    'scholarships','semesters','slot_requests','student_documents','student_settings',
    'teacher_reviews','tp_grades','tp_progress','tp_sessions','transcript_lines',
    'transcripts'
  ];
begin
  foreach t in array tbls loop
    if to_regclass('public.' || t) is null then continue; end if;  -- table absente : on ignore
    execute format(
      'alter table public.%I add column if not exists org_id uuid references public.organizations(id)', t);
    execute format('update public.%I set org_id = %L where org_id is null', t, jfn);
    execute format('create index if not exists %I on public.%I(org_id)', t || '_org_idx', t);
  end loop;
end $$;

-- ── 2. Fonctions d'aide (créées APRÈS l'ajout de users.org_id) ──
create or replace function public.current_org_id() returns uuid
  language sql stable security definer set search_path = public as $$
    select org_id from public.users where id = auth.uid()
  $$;

create or replace function public.current_user_role() returns text
  language sql stable security definer set search_path = public as $$
    select role from public.users where id = auth.uid()
  $$;

-- ── 3. Défaut auto : à l'insertion, org_id = tenant courant ──
-- (users est peuplé explicitement par l'app à l'inscription : pas de défaut.)
do $$
declare
  t text;
  tbls text[] := array[
    'inscriptions','program_courses','course_chapters','course_sessions',
    'chapter_progress','remote_machines','exams','exam_questions','exam_attempts',
    'deliberations','lives','academic_years','agent_tasks','attendance','audit_log',
    'cahier_texte','calendar_events','certification_enrollments','certifications',
    'cohort_members','cohorts','community_messages','course_chat','course_feedback',
    'course_notes','course_resources','course_tps','diplomas','dm_messages',
    'ects_ledger','extra_courses','extra_enrollments','fee_schedules','forum_messages',
    'internal_messages','invoices','journal_articles','journal_reactions',
    'jury_decisions','jury_members','jury_sessions','live_attendance','media_assets',
    'native_progress','notifications','payments','push_tokens','room_bookings','rooms',
    'scholarships','semesters','slot_requests','student_documents','student_settings',
    'teacher_reviews','tp_grades','tp_progress','tp_sessions','transcript_lines',
    'transcripts'
  ];
begin
  foreach t in array tbls loop
    if to_regclass('public.' || t) is null then continue; end if;  -- table absente : on ignore
    execute format(
      'alter table public.%I alter column org_id set default public.current_org_id()', t);
  end loop;
end $$;
