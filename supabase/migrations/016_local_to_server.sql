-- ════════════════════════════════════════════════════════════
-- 016_local_to_server.sql — Fin de la dette localStorage (chantier D1)
--   • notes personnelles par cours/chapitre
--   • préférences étudiant (mode de cycle, prefs diverses)
--   • demandes de créneau
--   • chat de cours (étudiant ↔ enseignant)
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- 1. Notes personnelles (une note par étudiant et par cours/chapitre)
create table if not exists public.course_notes (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null,
  program_course_id  uuid not null,
  body               text,
  updated_at         timestamptz not null default now(),
  unique (student_id, program_course_id)
);
create index if not exists idx_course_notes_student on public.course_notes(student_id);
alter table public.course_notes enable row level security;
drop policy if exists "course_notes_all" on public.course_notes;
create policy "course_notes_all" on public.course_notes for all using (true) with check (true);

-- 2. Préférences étudiant (mode de cycle + prefs libres)
create table if not exists public.student_settings (
  student_id  uuid primary key,
  cycle_mode  text,                          -- 'online' | 'hybride' | 'presentiel'
  prefs       jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);
alter table public.student_settings enable row level security;
drop policy if exists "student_settings_all" on public.student_settings;
create policy "student_settings_all" on public.student_settings for all using (true) with check (true);

-- 3. Demandes de créneau (étudiant → administration)
create table if not exists public.slot_requests (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null,
  program_course_id  uuid,
  desired            text,                   -- créneau souhaité (texte libre : "Mercredi 20h00-21h00…")
  status             text not null default 'en_attente', -- en_attente | valide | rejete
  created_at         timestamptz not null default now()
);
create index if not exists idx_slot_requests_student on public.slot_requests(student_id);
create index if not exists idx_slot_requests_course on public.slot_requests(program_course_id);
alter table public.slot_requests enable row level security;
drop policy if exists "slot_requests_all" on public.slot_requests;
create policy "slot_requests_all" on public.slot_requests for all using (true) with check (true);

-- 4. Chat de cours (panneau « Chat prof » du lecteur de cours)
create table if not exists public.course_chat (
  id                 uuid primary key default gen_random_uuid(),
  program_course_id  uuid not null,
  user_id            uuid,
  author_name        text,
  role               text,                   -- 'etudiant' | 'enseignant'
  body               text not null,
  created_at         timestamptz not null default now()
);
create index if not exists idx_course_chat_course on public.course_chat(program_course_id, created_at);
alter table public.course_chat enable row level security;
drop policy if exists "course_chat_all" on public.course_chat;
create policy "course_chat_all" on public.course_chat for all using (true) with check (true);
