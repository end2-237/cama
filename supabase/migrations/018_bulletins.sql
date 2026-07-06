-- ════════════════════════════════════════════════════════════
-- 018_bulletins.sql — Bulletins / relevés de notes semestriels
--   • transcripts : en-tête du relevé (moyenne, ECTS, mention, décision)
--   • transcript_lines : détail par UE (note, crédit obtenu, source)
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create table if not exists public.transcripts (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null,
  academic_year text not null,
  semester      int not null,
  parcours_slug text,
  average       numeric(4,2),
  ects_earned   int default 0,
  ects_total    int default 0,
  mention       text,                    -- 'Très Bien' | 'Bien' | 'Assez Bien' | 'Passable' | null
  decision      text,                    -- 'admis' | 'rattrapage' | 'ajourne'
  generated_at  timestamptz default now(),
  generated_by  uuid,
  unique(student_id, academic_year, semester)
);
create index if not exists idx_transcripts_student on public.transcripts(student_id);
alter table public.transcripts enable row level security;
drop policy if exists "transcripts_all" on public.transcripts;
create policy "transcripts_all" on public.transcripts for all using (true) with check (true);

create table if not exists public.transcript_lines (
  id                uuid primary key default gen_random_uuid(),
  transcript_id     uuid references public.transcripts(id) on delete cascade,
  program_course_id uuid,
  course_title      text,
  code              text,
  ects              int default 0,
  note              numeric(4,2),
  credit_obtenu     boolean default false,
  source            text                 -- 'examen' | 'tp' | 'examen+tp' | 'aucune'
);
create index if not exists idx_tlines_transcript on public.transcript_lines(transcript_id);
alter table public.transcript_lines enable row level security;
drop policy if exists "transcript_lines_all" on public.transcript_lines;
create policy "transcript_lines_all" on public.transcript_lines for all using (true) with check (true);
