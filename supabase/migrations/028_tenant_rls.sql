-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Étape 2b — RLS réelle : isolation par organisation
-- Chaque table métier n'est visible/modifiable que dans le tenant
-- courant (org_id = current_org_id()). Un super-admin plateforme
-- voit tout. La table users a des règles spécifiques (auto-profil).
-- Idempotent : réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- Super-admin plateforme (transverse aux organisations).
create or replace function public.is_platform_admin() returns boolean
  language sql stable security definer set search_path = public as $$
    select coalesce(
      (select admin_level = 'super_admin' from public.users where id = auth.uid()),
      false)
  $$;

-- ── users : profil propre + membres du même tenant + super-admin ──
alter table public.users enable row level security;
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='users' loop
    execute format('drop policy if exists %I on public.users', p.policyname);
  end loop;
end $$;

create policy "users_select" on public.users for select
  using (id = auth.uid() or org_id = public.current_org_id() or public.is_platform_admin());
create policy "users_insert" on public.users for insert
  with check (id = auth.uid() or public.is_platform_admin());
create policy "users_update" on public.users for update
  using (id = auth.uid()
         or (public.current_user_role() = 'admin' and org_id = public.current_org_id())
         or public.is_platform_admin())
  with check (id = auth.uid()
         or (public.current_user_role() = 'admin' and org_id = public.current_org_id())
         or public.is_platform_admin());
create policy "users_delete" on public.users for delete
  using ((public.current_user_role() = 'admin' and org_id = public.current_org_id())
         or public.is_platform_admin());

-- ── Toutes les autres tables métier : isolation stricte par org_id ──
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
  pol record;
begin
  foreach t in array tbls loop
    execute format('alter table public.%I enable row level security', t);
    -- retire toutes les policies existantes (souvent permissives)
    for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
    -- isolation par tenant (+ super-admin plateforme)
    execute format($f$
      create policy "tenant_isolation" on public.%I for all
        using (org_id = public.current_org_id() or public.is_platform_admin())
        with check (org_id = public.current_org_id() or public.is_platform_admin())
    $f$, t);
  end loop;
end $$;
