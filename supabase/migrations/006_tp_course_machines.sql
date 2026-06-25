-- ════════════════════════════════════════════════════════════
-- 006_tp_course_machines.sql — Machines de TP rattachées à un cours
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
--
-- Une machine distante appartient désormais à UN cours (program_course)
-- et n'est visible par l'étudiant que si elle est marquée « disponible »
-- par l'enseignant (ouverture/fermeture du TP comme une séance).
-- ════════════════════════════════════════════════════════════

alter table public.remote_machines
  add column if not exists program_course_id uuid references public.program_courses(id) on delete cascade;

alter table public.remote_machines
  add column if not exists available boolean not null default false;

create index if not exists idx_rm_course on public.remote_machines(program_course_id);
