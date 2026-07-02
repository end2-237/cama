-- ════════════════════════════════════════════════════════════
-- 008_course_cover.sql — Image de couverture des cours
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
--
-- L'enseignant peut ajouter une image à son cours ; elle illustre le
-- cours et tous ses documents dans la Bibliothèque.
-- ════════════════════════════════════════════════════════════

alter table public.program_courses
  add column if not exists cover_url text;
