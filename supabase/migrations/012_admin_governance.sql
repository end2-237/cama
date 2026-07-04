-- ════════════════════════════════════════════════════════════
-- 012_admin_governance.sql — Gouvernance administrative CAMA
--   • 3 niveaux d'administration (modèle académique)
--   • évaluation cours + prof par l'étudiant
--   • messagerie interne
--   • journal d'audit
--   • rôle gestionnaire des ressources média
--   • proctoring caméra / mode physique des examens
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- 1. Niveaux d'administration (hiérarchie inspirée du modèle académique)
--    coordinateur  = semi-admin : gère les étudiants d'une/plusieurs filières
--    admin         = directeur  : gestion élargie
--    super_admin   = recteur    : gestion globale complète
alter table public.users
  add column if not exists admin_level text,                       -- 'coordinateur' | 'admin' | 'super_admin'
  add column if not exists admin_scope text[] not null default '{}',-- filières gérées (parcours_slug) pour un coordinateur
  add column if not exists is_media_manager boolean not null default false;

-- 2. Évaluation d'un cours ET de son enseignant par l'étudiant
--    (course_feedback existe déjà en 010 : on l'étend au retour sur le prof)
alter table public.course_feedback
  add column if not exists teacher_rating int check (teacher_rating between 1 and 5),
  add column if not exists teacher_comment text;

-- 3. Messagerie interne (DM : admin↔admin, admin↔prof, admin↔étudiant,
--    coordinateur↔coordinateur…)
create table if not exists public.internal_messages (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id   uuid not null references public.users(id) on delete cascade,
  subject      text,
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_im_to on public.internal_messages(to_user_id);
create index if not exists idx_im_from on public.internal_messages(from_user_id);
alter table public.internal_messages enable row level security;
drop policy if exists "internal_messages_all" on public.internal_messages;
create policy "internal_messages_all" on public.internal_messages for all using (true) with check (true);

-- 4. Journal d'audit (rapports & traçabilité pour l'administration)
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.users(id) on delete set null,
  actor_name  text,
  action      text not null,          -- ex. 'inscription.validee', 'role.change', 'exam.open'
  entity      text,                   -- ex. 'user:123', 'exam:abc'
  detail      text,
  severity    text not null default 'info', -- info | warn | critical
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_log(created_at desc);
create index if not exists idx_audit_action on public.audit_log(action);
alter table public.audit_log enable row level security;
drop policy if exists "audit_log_all" on public.audit_log;
create policy "audit_log_all" on public.audit_log for all using (true) with check (true);

-- 5. Ressources média du site (gérées par le media_manager, visibles par tous)
create table if not exists public.media_assets (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  kind        text not null default 'image',  -- image | video | logo | document | audio
  category    text,
  url         text not null,
  description text,
  size_mo     numeric,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_media_kind on public.media_assets(kind);
alter table public.media_assets enable row level security;
drop policy if exists "media_assets_all" on public.media_assets;
create policy "media_assets_all" on public.media_assets for all using (true) with check (true);

-- 6. Proctoring caméra + mode physique des examens
alter table public.exams
  add column if not exists require_camera boolean not null default true;   -- caméra imposée
alter table public.exam_attempts
  add column if not exists physical boolean not null default false,        -- composition physique (caméra HS)
  add column if not exists camera_ok boolean not null default false,       -- caméra activée & consentie
  add column if not exists proctoring jsonb not null default '[]';         -- horodatages / instantanés de surveillance
