-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Étape 8 — Catégories d'établissements
--
-- Jusqu'ici, organizations.vertical était figé par une contrainte à
-- trois valeurs (academique, langues, pro). Impossible d'ouvrir un
-- centre de bureautique, une auto-école ou un soutien scolaire sans
-- modifier le schéma.
--
-- Désormais :
--   · public.org_categories est un CATALOGUE, géré par l'équipe CAMA
--     (/plateforme), sans migration pour chaque nouvelle catégorie ;
--   · chaque catégorie s'appuie sur un des trois MODÈLES de
--     fonctionnement que l'application sait faire tourner
--     (family : academique | langues | pro) — structure, modules ;
--   · elle porte son propre vocabulaire (terms) : « Formation »,
--     « Atelier », « Attestation »… qui remplace celui du modèle ;
--   · organizations.vertical devient une référence à ce catalogue :
--     changer l'orientation d'un établissement = changer cette valeur.
--
-- Les trois valeurs existantes restent des catégories : aucun
-- établissement n'est modifié. Idempotent : réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- 1. Le catalogue
create table if not exists public.org_categories (
  id          text primary key
              check (id ~ '^[a-z0-9][a-z0-9_-]{1,40}$'),
  label       text not null,
  description text not null default '',
  family      text not null default 'pro'
              check (family in ('academique', 'langues', 'pro')),
  terms       jsonb not null default '{}'::jsonb,
  features    text[] not null default '{}',     -- modules activés d'office pour la catégorie
  icon        text,
  active      boolean not null default true,    -- proposée à l'inscription et à la création
  sort        int not null default 100,
  created_at  timestamptz not null default now()
);

comment on table public.org_categories is
  'Catégories d''établissements (white-label métier). family = modèle de fonctionnement, terms = vocabulaire affiché.';
comment on column public.org_categories.terms is
  'Clés reconnues : platformLabel, heroLine1, heroLine2, heroTail, levelWord, groupWord, unitWord, creditWord, programWord.';

-- 2. Catégories de départ. Les trois historiques gardent leur identifiant.
insert into public.org_categories (id, label, description, family, terms, sort) values
  ('academique', 'Académique', 'Université, institut, cursus & ECTS', 'academique', '{}', 10),
  ('langues', 'Langues', 'École de langues, niveaux A1→C2', 'langues', '{}', 20),
  ('pro', 'Formation pro', 'Centre pro, modules & certifications', 'pro', '{}', 30),
  ('bureautique', 'Bureautique', 'Word, Excel, PowerPoint, Internet, initiation à l''ordinateur', 'pro',
   '{"platformLabel":"Centre de bureautique","heroLine1":"Maîtrisez","heroLine2":"l''outil informatique","heroTail":"pour le travail.","levelWord":"Niveau","groupWord":"Module","unitWord":"Atelier","creditWord":"Heure","programWord":"Formation"}', 40),
  ('informatique', 'Informatique & numérique', 'Développement, réseaux, design, marketing digital', 'pro',
   '{"platformLabel":"École du numérique","heroLine1":"Apprenez les","heroLine2":"métiers du numérique","heroTail":"par la pratique.","levelWord":"Niveau","groupWord":"Module","unitWord":"Compétence","creditWord":"Crédit","programWord":"Parcours"}', 50),
  ('soutien-scolaire', 'Soutien scolaire', 'Cours de répétition, préparation aux examens officiels', 'academique',
   '{"platformLabel":"Soutien scolaire","heroLine1":"Réussissez","heroLine2":"vos examens","heroTail":"avec méthode.","levelWord":"Classe","groupWord":"Trimestre","unitWord":"Matière","creditWord":"Point","programWord":"Programme"}', 60),
  ('enseignement-general', 'Collège & lycée', 'Établissement d''enseignement secondaire', 'academique',
   '{"platformLabel":"Établissement scolaire","heroLine1":"Construisez","heroLine2":"votre réussite","heroTail":"jour après jour.","levelWord":"Classe","groupWord":"Trimestre","unitWord":"Matière","creditWord":"Coefficient","programWord":"Programme"}', 70),
  ('metiers', 'Métiers & artisanat', 'Couture, coiffure, esthétique, électricité, mécanique', 'pro',
   '{"platformLabel":"Centre de métiers","heroLine1":"Apprenez","heroLine2":"un métier","heroTail":"qui vous fait vivre.","levelWord":"Niveau","groupWord":"Module","unitWord":"Atelier","creditWord":"Heure","programWord":"Formation"}', 80),
  ('sante', 'Santé & paramédical', 'Aide-soignant, secourisme, pharmacie, laboratoire', 'pro',
   '{"platformLabel":"Institut paramédical","heroLine1":"Formez-vous","heroLine2":"aux métiers de la santé","heroTail":"avec rigueur.","levelWord":"Année","groupWord":"Semestre","unitWord":"Module","creditWord":"Crédit","programWord":"Filière"}', 90),
  ('arts', 'Arts & musique', 'Musique, danse, théâtre, dessin, photographie', 'pro',
   '{"platformLabel":"École des arts","heroLine1":"Révélez","heroLine2":"votre talent","heroTail":"sur scène et ailleurs.","levelWord":"Niveau","groupWord":"Cycle","unitWord":"Atelier","creditWord":"Heure","programWord":"Cursus"}', 100),
  ('auto-ecole', 'Auto-école', 'Code de la route et conduite', 'pro',
   '{"platformLabel":"Auto-école","heroLine1":"Obtenez","heroLine2":"votre permis","heroTail":"en toute confiance.","levelWord":"Étape","groupWord":"Phase","unitWord":"Leçon","creditWord":"Heure","programWord":"Formation"}', 110),
  ('entreprise', 'Formation en entreprise', 'Académie interne, onboarding, formation continue des équipes', 'pro',
   '{"platformLabel":"Académie d''entreprise","heroLine1":"Faites grandir","heroLine2":"vos équipes","heroTail":"en continu.","levelWord":"Niveau","groupWord":"Module","unitWord":"Compétence","creditWord":"Heure","programWord":"Parcours"}', 120)
on conflict (id) do nothing;

-- 3. Une catégorie inconnue utilisée par un établissement (donnée ancienne)
--    est ajoutée au catalogue, rattachée au modèle « pro », pour que la
--    clé étrangère puisse être posée sans rien perdre.
insert into public.org_categories (id, label, family)
select distinct o.vertical, initcap(o.vertical), 'pro'
from public.organizations o
where o.vertical is not null
  and not exists (select 1 from public.org_categories c where c.id = o.vertical)
on conflict (id) do nothing;

-- 4. organizations.vertical : de la liste figée à la référence au catalogue.
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.conrelid = 'public.organizations'::regclass
      and con.contype = 'c' and att.attname = 'vertical'
  loop
    execute format('alter table public.organizations drop constraint %I', c.conname);
  end loop;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organizations'::regclass and conname = 'organizations_vertical_fkey'
  ) then
    alter table public.organizations
      add constraint organizations_vertical_fkey
      foreign key (vertical) references public.org_categories(id) on update cascade;
  end if;
end $$;

comment on column public.organizations.vertical is
  'Catégorie de l''établissement (public.org_categories.id). La changer = changer son orientation.';

-- 5. Droits : le catalogue se lit librement (page d'inscription, avant
--    connexion) ; seule l'équipe plateforme l'écrit.
alter table public.org_categories enable row level security;

drop policy if exists "categories_read" on public.org_categories;
create policy "categories_read" on public.org_categories for select using (true);

drop policy if exists "categories_platform_write" on public.org_categories;
create policy "categories_platform_write" on public.org_categories for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());

grant select on public.org_categories to anon, authenticated;
grant insert, update, delete on public.org_categories to authenticated;   -- filtré par la règle ci-dessus

-- 6. L'admin d'un établissement garde la main sur son identité (nom,
--    logo, couleurs) et peut changer sa catégorie, mais pas son statut,
--    son plan ni ses modules : ce sont des décisions commerciales, prises
--    par la plateforme ou par le paiement (clé service).
create or replace function public.protege_org_commercial() returns trigger
  language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_platform_admin() then
    if new.status is distinct from old.status
       or new.plan_id is distinct from old.plan_id
       or new.features is distinct from old.features
       or new.slug is distinct from old.slug
       or new.subdomain is distinct from old.subdomain
       or new.custom_domain is distinct from old.custom_domain then
      raise exception 'Statut, plan, modules et adresse se modifient depuis la plateforme';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists organizations_protege_commercial on public.organizations;
create trigger organizations_protege_commercial
  before update on public.organizations
  for each row execute function public.protege_org_commercial();

notify pgrst, 'reload schema';
