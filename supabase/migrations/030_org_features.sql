-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Étape 4 — Modules à la carte (entitlements)
-- Colonne features[] (overrides) + plan par défaut. La disponibilité
-- effective est calculée côté app (src/lib/features.ts) à partir du
-- vertical + plan + overrides. TP/VM = pro/IT + palier Business/Enterprise.
-- Idempotent.
-- ════════════════════════════════════════════════════════════

alter table public.organizations
  add column if not exists features text[] not null default '{}';

-- Paliers par défaut + override TP/VM pour JFN (académique, mais utilise déjà les TP).
update public.organizations
  set plan_id = coalesce(plan_id, 'business'),
      features = case when features = '{}' then array['tp_vm'] else features end
  where slug = 'jfn';

update public.organizations
  set plan_id = coalesce(plan_id, 'starter')
  where slug = 'demo';
