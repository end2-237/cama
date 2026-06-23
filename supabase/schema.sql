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
-- 7. TP — MACHINES LINUX DISTANTES (terminal web embarqué)
-- ════════════════════════════════════════════════════════════
create table if not exists public.remote_machines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  os          text not null default 'Linux',
  kind        text not null default 'ttyd',   -- ttyd|wetty|guacamole|vnc|other
  web_url     text not null,                  -- URL HTTPS du terminal web
  description text,
  status      text not null default 'unknown',-- up|down|unknown
  added_by    uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════
-- 8. EXAMENS & ÉVALUATIONS (Phase 3)
-- ════════════════════════════════════════════════════════════
create table if not exists public.exams (
  id                uuid primary key default gen_random_uuid(),
  program_course_id uuid not null references public.program_courses(id) on delete cascade,
  title             text not null,
  duration_min      int  not null default 60,
  status            text not null default 'planifie',  -- planifie|ouvert|termine
  scheduled_at      timestamptz,
  shuffle           boolean not null default true,
  created_by        uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists idx_exams_course on public.exams(program_course_id);

create table if not exists public.exam_questions (
  id            uuid primary key default gen_random_uuid(),
  exam_id       uuid not null references public.exams(id) on delete cascade,
  ordre         int  not null default 0,
  type          text not null default 'qcm',       -- qcm|ouverte
  text          text not null,
  options       text[] not null default '{}',
  correct_index int,                                -- index bonne réponse (qcm)
  points        int  not null default 1
);
create index if not exists idx_eq_exam on public.exam_questions(exam_id);

create table if not exists public.exam_attempts (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references public.exams(id) on delete cascade,
  student_id   uuid not null references public.users(id) on delete cascade,
  status       text not null default 'encours',     -- encours|soumis|corrige
  started_at   timestamptz not null default now(),
  submitted_at timestamptz,
  answers      jsonb not null default '{}',          -- { questionId: indexOuTexte }
  score        numeric,
  score_max    numeric,
  feedback     text,
  alerts       jsonb not null default '[]',          -- [{time,type,detail}]
  unique (exam_id, student_id)
);
create index if not exists idx_att_student on public.exam_attempts(student_id);
create index if not exists idx_att_exam on public.exam_attempts(exam_id);

create table if not exists public.deliberations (
  id                uuid primary key default gen_random_uuid(),
  program_course_id uuid not null references public.program_courses(id) on delete cascade,
  student_id        uuid not null references public.users(id) on delete cascade,
  attempt_id        uuid references public.exam_attempts(id) on delete set null,
  note              numeric,                          -- /20
  credits           int  not null default 0,
  status            text not null default 'en_delib', -- en_delib|valide|rejete
  validated_by      uuid references public.users(id) on delete set null,
  validated_at      timestamptz,
  comment           text,
  created_at        timestamptz not null default now(),
  unique (program_course_id, student_id)
);
create index if not exists idx_delib_student on public.deliberations(student_id);

-- ════════════════════════════════════════════════════════════
-- RLS désactivée (prototype — clé anon en accès direct)
-- ════════════════════════════════════════════════════════════
alter table public.inscriptions    disable row level security;
alter table public.program_courses disable row level security;
alter table public.course_chapters disable row level security;
alter table public.course_sessions disable row level security;
alter table public.chapter_progress disable row level security;
alter table public.remote_machines disable row level security;
alter table public.exams           disable row level security;
alter table public.exam_questions  disable row level security;
alter table public.exam_attempts   disable row level security;
alter table public.deliberations   disable row level security;
