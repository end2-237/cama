-- ════════════════════════════════════════════════════════════
-- CAMA — Migration 002 : ressources, calendrier, hors-cursus,
--        présences, certifications + bucket de stockage médias
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ════════════════════════════════════════════════════════════
-- 1. RESSOURCES DE COURS (syllabus, supports, bibliographie, liens)
--    Téléversées par l'enseignant ; visibles par l'étudiant.
-- ════════════════════════════════════════════════════════════
create table if not exists public.course_resources (
  id                uuid primary key default gen_random_uuid(),
  program_course_id uuid not null references public.program_courses(id) on delete cascade,
  kind              text not null default 'support',   -- syllabus|support|biblio|lien
  title             text not null,
  url               text,                              -- URL publique (storage) ou lien externe
  size_mo           numeric,                           -- poids du fichier (data budgeting)
  created_by        uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists idx_cr_course on public.course_resources(program_course_id);

-- ════════════════════════════════════════════════════════════
-- 2. CALENDRIER ACADÉMIQUE (géré par l'admin → onglet Planification)
-- ════════════════════════════════════════════════════════════
create table if not exists public.calendar_events (
  id            uuid primary key default gen_random_uuid(),
  date_label    text not null,                         -- "08 sept. 2025" ou "05 — 17 janv. 2026"
  sort_date     date,                                  -- pour le tri chronologique
  label         text not null,
  type          text not null default 'event',         -- cours|examen|jury|resultat|admin|vacances|event
  semester      int  not null default 1,               -- 1 ou 2
  academic_year text not null default '2025-2026',
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_ce_year on public.calendar_events(academic_year, semester);

-- ════════════════════════════════════════════════════════════
-- 3. COURS HORS-CURSUS (extra-curriculaires, gérés par l'admin)
--    Se fondent dans le calendrier personnel de l'étudiant.
-- ════════════════════════════════════════════════════════════
create table if not exists public.extra_courses (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  code            text,                                -- ex: SOFT-LEAD-01
  category        text not null default 'Soft skills', -- Soft skills|Langues|Entrepreneuriat|Tech|Autre
  description     text,
  instructor_name text,                                -- nom libre de l'intervenant
  teacher_id      uuid references public.users(id) on delete set null,
  mode            text not null default 'hybride',     -- online|hybride|presentiel
  capacity        int  not null default 30,
  day             text,                                -- Lundi..Samedi
  start_time      text,                                -- "18h00"
  end_time        text,                                -- "20h00"
  room            text,
  starts_on       date,
  sessions_count  int  not null default 8,
  color           text not null default '#7C3AED',     -- couleur d'accent
  published       boolean not null default false,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_ec_published on public.extra_courses(published);

-- Participants aux cours hors-cursus (progression + satisfaction)
create table if not exists public.extra_enrollments (
  id              uuid primary key default gen_random_uuid(),
  extra_course_id uuid not null references public.extra_courses(id) on delete cascade,
  student_id      uuid not null references public.users(id) on delete cascade,
  status          text not null default 'inscrit',     -- inscrit|en_cours|termine|abandon
  progress        int  not null default 0,             -- 0..100
  satisfaction    int,                                  -- 1..5 (null tant que non noté)
  enrolled_at     timestamptz not null default now(),
  unique (extra_course_id, student_id)
);
create index if not exists idx_ee_course  on public.extra_enrollments(extra_course_id);
create index if not exists idx_ee_student on public.extra_enrollments(student_id);

-- ════════════════════════════════════════════════════════════
-- 4. PRÉSENCES (liste de présence par cycle / type de cycle)
--    Admin (toutes filières) + enseignant (ses séances).
-- ════════════════════════════════════════════════════════════
create table if not exists public.attendance (
  id                uuid primary key default gen_random_uuid(),
  program_course_id uuid references public.program_courses(id) on delete cascade,
  session_id        uuid references public.course_sessions(id) on delete set null,
  student_id        uuid not null references public.users(id) on delete cascade,
  session_date      date not null,
  present           boolean not null default false,
  cycle             text,                              -- L1..M2 (annee_niveau au moment du pointage)
  mode              text,                              -- online|hybride|presentiel
  marked_by         uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (program_course_id, student_id, session_date)
);
create index if not exists idx_att_course on public.attendance(program_course_id);
create index if not exists idx_att_date   on public.attendance(session_date);

-- ════════════════════════════════════════════════════════════
-- 5. CERTIFICATIONS (gérées par l'admin — ex: AWS, Cisco…)
--    L'étudiant s'inscrit et participe dans un environnement dédié.
-- ════════════════════════════════════════════════════════════
create table if not exists public.certifications (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,                       -- "AWS Certified Cloud Practitioner"
  provider        text not null default 'CAMA',        -- AWS|Cisco|Google|Microsoft|CAMA…
  code            text,                                -- CLF-C02
  description     text,
  level           text not null default 'Fondation',   -- Fondation|Associate|Professionnel|Expert
  duration_h      int  not null default 20,
  environment_url text,                                -- lien vers l'environnement / lab dédié
  badge_color     text not null default '#F59E0B',
  capacity        int,                                 -- null = illimité
  exam_fee        text,                                -- libre ("100 USD" / "Gratuit")
  published       boolean not null default false,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_cert_published on public.certifications(published);

create table if not exists public.certification_enrollments (
  id               uuid primary key default gen_random_uuid(),
  certification_id uuid not null references public.certifications(id) on delete cascade,
  student_id       uuid not null references public.users(id) on delete cascade,
  status           text not null default 'inscrit',    -- inscrit|en_cours|obtenu|echec
  progress         int  not null default 0,            -- 0..100
  score            text,                               -- score libre à l'examen
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  unique (certification_id, student_id)
);
create index if not exists idx_certenr_cert    on public.certification_enrollments(certification_id);
create index if not exists idx_certenr_student on public.certification_enrollments(student_id);

-- ════════════════════════════════════════════════════════════
-- 6. RLS désactivée (prototype — clé anon en accès direct)
-- ════════════════════════════════════════════════════════════
alter table public.course_resources          disable row level security;
alter table public.calendar_events           disable row level security;
alter table public.extra_courses             disable row level security;
alter table public.extra_enrollments         disable row level security;
alter table public.attendance                disable row level security;
alter table public.certifications            disable row level security;
alter table public.certification_enrollments disable row level security;

-- ════════════════════════════════════════════════════════════
-- 7. STORAGE — bucket public pour les médias de cours (PDF / vidéos)
--    Les enseignants téléversent ; lecture publique (data budgeting côté UI).
-- ════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-media', 'course-media', true,
  524288000,                                            -- 500 Mo max / fichier
  array['application/pdf','video/mp4','video/webm','video/quicktime','image/png','image/jpeg']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Accès anon (prototype) : lecture + écriture sur le bucket course-media
drop policy if exists "course-media read"  on storage.objects;
drop policy if exists "course-media write" on storage.objects;
drop policy if exists "course-media update" on storage.objects;
drop policy if exists "course-media delete" on storage.objects;
create policy "course-media read"   on storage.objects for select using (bucket_id = 'course-media');
create policy "course-media write"  on storage.objects for insert with check (bucket_id = 'course-media');
create policy "course-media update" on storage.objects for update using (bucket_id = 'course-media');
create policy "course-media delete" on storage.objects for delete using (bucket_id = 'course-media');
