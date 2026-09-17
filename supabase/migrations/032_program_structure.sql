-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Étape 6 — Constructeur de programme (par établissement)
-- Filières (program_tracks) et niveaux (program_levels) pilotés par la
-- base, par org. Register & /admin/programme lisent ces données quand
-- elles existent, sinon repli sur PARCOURS codé en dur (JFN inchangé).
-- Idempotent.
-- ════════════════════════════════════════════════════════════

-- ── Filières / parcours de l'établissement ──
create table if not exists public.program_tracks (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default public.current_org_id() references public.organizations(id),
  slug       text not null,
  title      text not null,
  cycle_type text not null default 'Licence',
  ordre      integer not null default 0,
  created_at timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists program_tracks_org_idx on public.program_tracks(org_id);

-- ── Niveaux de l'établissement (L1…M2, ou A1…C2, ou modules pro) ──
create table if not exists public.program_levels (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default public.current_org_id() references public.organizations(id),
  code       text not null,
  title      text not null,
  ordre      integer not null default 0,
  created_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists program_levels_org_idx on public.program_levels(org_id);

-- ── RLS : isolation par établissement (+ super-admin plateforme) ──
alter table public.program_tracks enable row level security;
alter table public.program_levels enable row level security;

drop policy if exists "program_tracks_tenant" on public.program_tracks;
create policy "program_tracks_tenant" on public.program_tracks for all
  using (org_id = public.current_org_id() or public.is_platform_admin())
  with check (org_id = public.current_org_id() or public.is_platform_admin());

drop policy if exists "program_levels_tenant" on public.program_levels;
create policy "program_levels_tenant" on public.program_levels for all
  using (org_id = public.current_org_id() or public.is_platform_admin())
  with check (org_id = public.current_org_id() or public.is_platform_admin());

-- ── Seed : établissement de langues (demo) — filières + niveaux A1→C2 ──
do $$
declare demo_id uuid;
begin
  select id into demo_id from public.organizations where slug = 'demo';
  if demo_id is not null then
    insert into public.program_tracks (org_id, slug, title, cycle_type, ordre) values
      (demo_id, 'anglais',  'Anglais',  'Langue', 1),
      (demo_id, 'francais', 'Français', 'Langue', 2),
      (demo_id, 'espagnol', 'Espagnol', 'Langue', 3)
    on conflict (org_id, slug) do nothing;
    insert into public.program_levels (org_id, code, title, ordre) values
      (demo_id, 'A1', 'A1 · Débutant', 1),
      (demo_id, 'A2', 'A2 · Élémentaire', 2),
      (demo_id, 'B1', 'B1 · Intermédiaire', 3),
      (demo_id, 'B2', 'B2 · Intermédiaire avancé', 4),
      (demo_id, 'C1', 'C1 · Autonome', 5),
      (demo_id, 'C2', 'C2 · Maîtrise', 6)
    on conflict (org_id, code) do nothing;
  end if;
end $$;
