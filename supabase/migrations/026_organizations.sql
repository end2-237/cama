-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Étape 1 — Table des établissements (multi-tenant)
-- Socle du white-label : identité + vertical + sous-domaine + plan.
-- (L'ajout de org_id sur les tables métier et la refonte RLS
--  arrivent à l'Étape 2.)
-- ════════════════════════════════════════════════════════════

create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  logo_url      text,
  primary_color text,                         -- couleur de marque (hex) → thème
  accent_color  text,
  locale        text not null default 'fr',
  subdomain     text unique not null,
  custom_domain text unique,
  vertical      text not null default 'academique'
                check (vertical in ('academique','langues','pro')),
  plan_id       text,
  status        text not null default 'active'
                check (status in ('active','trial','suspended')),
  created_at    timestamptz not null default now()
);

comment on table public.organizations is
  'Établissements (tenants) du SaaS CAMA. Le branding pilote le thème dynamique.';

-- Seed : Institut JFN (tenant historique) + institut de démonstration.
insert into public.organizations
  (id, slug, name, logo_url, primary_color, accent_color, locale, subdomain, vertical, status)
values
  ('00000000-0000-0000-0000-000000000001','jfn','Institut JFN',
   '/campus/jfn-hui-logo.png','#4F46E5','#F59E0B','fr','jfn','academique','active'),
  ('00000000-0000-0000-0000-000000000002','demo','LinguaPro Academy',
   null,'#0EA5A4','#F97316','fr','demo','langues','trial')
on conflict (id) do nothing;

-- RLS : le branding est lisible publiquement (résolution par sous-domaine avant
-- connexion). Les écritures restent réservées au service role pour l'instant ;
-- la gestion fine (super-admin / admin d'org) sera ajoutée à l'Étape 3.
alter table public.organizations enable row level security;

drop policy if exists "orgs_public_read" on public.organizations;
create policy "orgs_public_read"
  on public.organizations for select
  using (true);
