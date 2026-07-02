-- ════════════════════════════════════════════════════════════
-- 010_suivi_qualite.sql — Suivi admin, qualité enseignants,
--   progression étudiante par cycle, replays des lives
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- 1. Replay des lives (les online regardent l'enregistrement hors horaire)
alter table public.lives
  add column if not exists recording_url text;

-- 2. Ancrage de lecture du cours natif (progression online/hybride)
--    Le client n'envoie que du temps de lecture VALIDE (scrolls rapides exclus).
create table if not exists public.native_progress (
  student_id  uuid not null references public.users(id) on delete cascade,
  chapter_id  uuid not null references public.course_chapters(id) on delete cascade,
  pct         int  not null default 0,      -- % du cours natif réellement ancré (0-100)
  read_ms     int  not null default 0,      -- temps de lecture valide cumulé
  fast_scrolls int not null default 0,      -- scrolls rapides détectés (non comptés)
  updated_at  timestamptz not null default now(),
  primary key (student_id, chapter_id)
);
alter table public.native_progress enable row level security;
drop policy if exists "native_progress_all" on public.native_progress;
create policy "native_progress_all" on public.native_progress for all using (true) with check (true);

-- 3. Retour étudiant sur un cours (qualité perçue)
create table if not exists public.course_feedback (
  id                 uuid primary key default gen_random_uuid(),
  program_course_id  uuid not null references public.program_courses(id) on delete cascade,
  student_id         uuid not null references public.users(id) on delete cascade,
  rating             int  not null check (rating between 1 and 5),
  comment            text,
  created_at         timestamptz not null default now(),
  unique (program_course_id, student_id)
);
alter table public.course_feedback enable row level security;
drop policy if exists "course_feedback_all" on public.course_feedback;
create policy "course_feedback_all" on public.course_feedback for all using (true) with check (true);

-- 4. Évaluation qualité d'un enseignant par l'administration
create table if not exists public.teacher_reviews (
  id                 uuid primary key default gen_random_uuid(),
  teacher_id         uuid not null references public.users(id) on delete cascade,
  program_course_id  uuid references public.program_courses(id) on delete set null,
  score              int  not null check (score between 1 and 5),
  comment            text,
  created_by         uuid references public.users(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index if not exists idx_tr_teacher on public.teacher_reviews(teacher_id);
alter table public.teacher_reviews enable row level security;
drop policy if exists "teacher_reviews_all" on public.teacher_reviews;
create policy "teacher_reviews_all" on public.teacher_reviews for all using (true) with check (true);
