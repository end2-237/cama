-- ════════════════════════════════════════════════════════════
-- CAMA — Schéma Supabase (source de vérité, idempotent)
-- À exécuter dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- ── Extensions ──
create extension if not exists pgcrypto;

-- ════════════════════════════════════════════════════════════
-- 1. PROFILS (public.users) — créé précédemment, colonnes additionnelles
-- ════════════════════════════════════════════════════════════
alter table public.users add column if not exists phone        text;
alter table public.users add column if not exists phone_prefix text default '+237';
alter table public.users add column if not exists student_card  text;

-- ════════════════════════════════════════════════════════════
-- 2. INSCRIPTIONS — dossier académique de l'étudiant
-- ════════════════════════════════════════════════════════════
create table if not exists public.inscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  matricule      text unique not null,
  parcours_slug  text not null,
  parcours_title text not null,
  school         text not null,
  cycle_type     text not null default 'Licence',
  level          text not null,
  mode           text not null default 'hybride',
  campus         text not null default 'Yaoundé',
  academic_year  text not null,
  semester       int  not null default 1,
  total_ects     int  not null default 180,
  status         text not null default 'en_attente',
  enrolled_at    timestamptz not null default now()
);
create index if not exists idx_inscriptions_user on public.inscriptions(user_id);

-- ════════════════════════════════════════════════════════════
-- 3. PROGRAMME ACADÉMIQUE + AFFECTATION + CONTENU
--    program_courses = 1 matière dans une filière (année × semestre)
--    • curriculum : géré/synchronisé par l'administration
--    • affectation : teacher_id posé par l'admin
--    • contenu : description/objectifs/… créés par l'enseignant assigné
-- ════════════════════════════════════════════════════════════
create table if not exists public.program_courses (
  id             uuid primary key default gen_random_uuid(),
  parcours_slug  text not null,
  parcours_title text not null,
  annee_niveau   text not null,                 -- L1, L2, L3, M1, M2
  semestre       text not null,                 -- S1..S6
  code           text not null,                 -- INF101
  title          text not null,
  ects           int  not null default 0,
  hours          int  not null default 0,       -- volume horaire total
  modalites      text[] not null default '{}',  -- video, pdf, plateforme, live
  evaluation     text,                          -- modalités d'évaluation
  ordre          int  not null default 0,
  -- ── Affectation (administration) ──
  teacher_id     uuid references public.users(id) on delete set null,
  academic_year  text,
  -- ── Contenu (enseignant assigné) ──
  description    text,
  objectives     text[] not null default '{}',
  competences    text[] not null default '{}',
  prerequis      text,
  audience       text,
  difficulte     text,                          -- Débutant|Intermédiaire|Avancé
  published      boolean not null default false,
  prof_ia        boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (parcours_slug, code)
);
create index if not exists idx_pc_parcours on public.program_courses(parcours_slug, semestre);
create index if not exists idx_pc_teacher  on public.program_courses(teacher_id);

-- ════════════════════════════════════════════════════════════
-- 4. CHAPITRES — contenu créé par l'enseignant
-- ════════════════════════════════════════════════════════════
create table if not exists public.course_chapters (
  id                uuid primary key default gen_random_uuid(),
  program_course_id uuid not null references public.program_courses(id) on delete cascade,
  ordre             int  not null default 0,
  title             text not null,
  pdf               jsonb,    -- { name, sizeMo, pages }
  video             jsonb,    -- { title, durationMin, transcript, sizeMo }
  natif             jsonb,    -- { blocks: [...] }
  live_id           uuid,
  created_at        timestamptz not null default now()
);
create index if not exists idx_ch_course on public.course_chapters(program_course_id);

-- ════════════════════════════════════════════════════════════
-- 5. SÉANCES (emploi du temps) — pré-rempli admin, proposé par prof
-- ════════════════════════════════════════════════════════════
create table if not exists public.course_sessions (
  id                uuid primary key default gen_random_uuid(),
  program_course_id uuid not null references public.program_courses(id) on delete cascade,
  title             text not null,
  day               text,                          -- Lundi..Samedi
  start_time        text,                          -- "08h00"
  end_time          text,                          -- "11h00"
  kind              text not null default 'campus',-- campus|live|async|examen
  room              text,
  modes             text[] not null default '{}',
  academic_year     text,
  semestre          text,
  week_start        date,                          -- semaine concernée (lundi)
  status            text not null default 'propose',-- propose|valide|rejete
  proposed_by       uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists idx_cs_course on public.course_sessions(program_course_id);
create index if not exists idx_cs_week   on public.course_sessions(week_start);

-- ════════════════════════════════════════════════════════════
-- 6. PROGRESSION — chapitres validés par l'étudiant
-- ════════════════════════════════════════════════════════════
create table if not exists public.chapter_progress (
  student_id uuid not null references public.users(id) on delete cascade,
  chapter_id uuid not null references public.course_chapters(id) on delete cascade,
  done_at    timestamptz not null default now(),
  primary key (student_id, chapter_id)
);
create index if not exists idx_cp_student on public.chapter_progress(student_id);

-- ════════════════════════════════════════════════════════════
-- RLS désactivée (prototype — clé anon en accès direct)
-- ════════════════════════════════════════════════════════════
alter table public.inscriptions    disable row level security;
alter table public.program_courses disable row level security;
alter table public.course_chapters disable row level security;
alter table public.course_sessions disable row level security;
alter table public.chapter_progress disable row level security;
