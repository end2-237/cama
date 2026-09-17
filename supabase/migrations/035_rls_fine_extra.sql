-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Sécurité fine — tables sensibles restantes
-- Ferme les fuites intra-établissement sur jury_decisions, diplomas,
-- attendance, cohort_members (lecture propre + écriture personnel) et
-- extra_enrollments, live_attendance (propriété étudiant).
-- Idempotent.
-- ════════════════════════════════════════════════════════════

-- Groupe A — émis par le personnel, lu par l'étudiant concerné (student_id)
do $$
declare
  t text;
  tbls text[] := array['jury_decisions','diplomas','attendance','cohort_members'];
  pol record;
begin
  foreach t in array tbls loop
    if to_regclass('public.' || t) is null then continue; end if;
    for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
    execute format($f$
      create policy "read_own_or_staff" on public.%I for select
        using (org_id = public.current_org_id() and (
          public.is_org_staff() or public.is_platform_admin() or student_id = auth.uid()))
    $f$, t);
    execute format($f$
      create policy "write_staff" on public.%I for insert
        with check (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin()))
    $f$, t);
    execute format($f$
      create policy "update_staff" on public.%I for update
        using (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin()))
        with check (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin()))
    $f$, t);
    execute format($f$
      create policy "delete_staff" on public.%I for delete
        using (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin()))
    $f$, t);
  end loop;
end $$;

-- Groupe B — propriété de l'étudiant (il écrit ses propres lignes)
-- extra_enrollments : student_id
do $$
declare pol record;
begin
  if to_regclass('public.extra_enrollments') is null then return; end if;
  for pol in select policyname from pg_policies where schemaname='public' and tablename='extra_enrollments' loop
    execute format('drop policy if exists %I on public.extra_enrollments', pol.policyname);
  end loop;
  execute $p$
    create policy "fine_owner" on public.extra_enrollments for all
      using (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin() or student_id = auth.uid()))
      with check (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin() or student_id = auth.uid()))
  $p$;
end $$;

-- live_attendance : user_id
do $$
declare pol record;
begin
  if to_regclass('public.live_attendance') is null then return; end if;
  for pol in select policyname from pg_policies where schemaname='public' and tablename='live_attendance' loop
    execute format('drop policy if exists %I on public.live_attendance', pol.policyname);
  end loop;
  execute $p$
    create policy "fine_owner" on public.live_attendance for all
      using (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin() or user_id = auth.uid()))
      with check (org_id = public.current_org_id() and (public.is_org_staff() or public.is_platform_admin() or user_id = auth.uid()))
  $p$;
end $$;
