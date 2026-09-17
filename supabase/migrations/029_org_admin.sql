-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Étape 3 — Gestion de l'organisation par son admin
-- L'admin d'un établissement peut mettre à jour SON org (branding,
-- etc.). La création se fait côté serveur (service role → bypass RLS).
-- Idempotent.
-- ════════════════════════════════════════════════════════════

-- L'admin de l'org (ou le super-admin plateforme) peut modifier son org.
drop policy if exists "orgs_admin_update" on public.organizations;
create policy "orgs_admin_update" on public.organizations for update
  using (
    id = public.current_org_id()
    and public.current_user_role() = 'admin'
    or public.is_platform_admin()
  )
  with check (
    id = public.current_org_id()
    and public.current_user_role() = 'admin'
    or public.is_platform_admin()
  );

-- Suppression réservée au super-admin plateforme.
drop policy if exists "orgs_platform_delete" on public.organizations;
create policy "orgs_platform_delete" on public.organizations for delete
  using (public.is_platform_admin());
