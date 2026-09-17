-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Intégrité intra-établissement
-- Un étudiant peut LIRE ses données officielles (notes, factures,
-- relevés…) mais NE PEUT PAS les créer/modifier — écriture réservée
-- au personnel. La note d'examen est protégée par trigger.
-- Idempotent.
-- ════════════════════════════════════════════════════════════

-- ── Tables « émises par le personnel, lues par l'étudiant » ──
-- (l'étudiant voit SES lignes ; seul le personnel écrit)
do $$
declare
  t text;
  tbls text[] := array[
    'deliberations','invoices','payments','transcripts','ects_ledger',
    'scholarships','certification_enrollments','tp_grades'
  ];
  pol record;
begin
  foreach t in array tbls loop
    for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
    -- lecture : l'étudiant voit ses lignes ; le personnel tout l'org
    execute format($f$
      create policy "read_own_or_staff" on public.%I for select
        using (org_id = public.current_org_id() and (
          public.is_org_staff() or public.is_platform_admin() or student_id = auth.uid()))
    $f$, t);
    -- écriture (insert/update/delete) : personnel uniquement
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

-- ── exam_attempts : l'étudiant gère SA copie (réponses) mais PAS la note ──
create or replace function public.guard_attempt_grade() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_org_staff() or public.is_platform_admin()) then
    if new.score is distinct from old.score
       or new.score_max is distinct from old.score_max then
      raise exception 'Seul le personnel peut modifier la note d''une copie.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_attempt_grade on public.exam_attempts;
create trigger trg_guard_attempt_grade
  before update on public.exam_attempts
  for each row execute function public.guard_attempt_grade();
