-- ════════════════════════════════════════════════════════════
-- 007_library.sql — Bibliothèque CAMA
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
--
-- La bibliothèque agrège les contenus existants (chapitres, ressources,
-- épreuves). Pour que les documents d'un enseignant restent dans SA
-- bibliothèque même si le cours lui est retiré, on trace l'auteur
-- (created_by) sur les chapitres, rempli avec l'enseignant du cours.
-- ════════════════════════════════════════════════════════════

alter table public.course_chapters
  add column if not exists created_by uuid references public.users(id) on delete set null;

-- Backfill : l'auteur d'un chapitre = l'enseignant actuel du cours.
update public.course_chapters ch
set created_by = pc.teacher_id
from public.program_courses pc
where ch.program_course_id = pc.id
  and ch.created_by is null
  and pc.teacher_id is not null;

create index if not exists idx_chapters_created_by on public.course_chapters(created_by);
