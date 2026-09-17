-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Sécurité fine intra-établissement
-- Corrige la fuite : un étudiant ne doit voir QUE ses propres données
-- sensibles (copies, notes, factures, documents, progression…).
-- Personnel (admin/enseignant/jury) et super-admin plateforme : tout l'org.
-- Idempotent.
-- ════════════════════════════════════════════════════════════

-- Est-ce un membre du personnel (accès élargi à l'établissement) ?
create or replace function public.is_org_staff() returns boolean
  language sql stable security definer set search_path = public as $$
    select coalesce(
      (select role in ('admin','enseignant','jury') from public.users where id = auth.uid()),
      false)
  $$;

-- ── Tables « propriété étudiant » (colonne student_id) ──
do $$
declare
  t text;
  tbls text[] := array[
    'exam_attempts','deliberations','chapter_progress','tp_grades','tp_progress',
    'invoices','payments','student_documents','transcripts','ects_ledger',
    'course_notes','native_progress','scholarships','certification_enrollments',
    'course_feedback'
  ];
  pol record;
begin
  foreach t in array tbls loop
    for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
    execute format($f$
      create policy "fine_owner" on public.%I for all
        using (
          org_id = public.current_org_id() and (
            public.is_org_staff() or public.is_platform_admin() or student_id = auth.uid()
          )
        )
        with check (
          org_id = public.current_org_id() and (
            public.is_org_staff() or public.is_platform_admin() or student_id = auth.uid()
          )
        )
    $f$, t);
  end loop;
end $$;

-- ── notifications : propriété via user_id ──
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='notifications' loop
    execute format('drop policy if exists %I on public.notifications', pol.policyname);
  end loop;
end $$;
create policy "fine_owner" on public.notifications for all
  using (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin() or user_id = auth.uid()))
  with check (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin() or user_id = auth.uid()));

-- ── teacher_reviews : propriété via created_by (l'étudiant auteur) ──
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='teacher_reviews' loop
    execute format('drop policy if exists %I on public.teacher_reviews', pol.policyname);
  end loop;
end $$;
create policy "fine_owner" on public.teacher_reviews for all
  using (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin() or created_by = auth.uid()))
  with check (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin() or created_by = auth.uid()));

-- ── transcript_lines : propriété via le relevé parent ──
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='transcript_lines' loop
    execute format('drop policy if exists %I on public.transcript_lines', pol.policyname);
  end loop;
end $$;
create policy "fine_owner" on public.transcript_lines for all
  using (
    org_id = public.current_org_id() and (
      public.is_org_staff() or public.is_platform_admin()
      or transcript_id in (select id from public.transcripts where student_id = auth.uid())
    )
  )
  with check (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin()));
