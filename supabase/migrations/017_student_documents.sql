-- ════════════════════════════════════════════════════════════
-- 017_student_documents.sql — Dossier administratif de l'étudiant
--   • dépôt de pièces justificatives par l'étudiant
--   • validation / refus par l'administration
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create table if not exists public.student_documents (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null,
  kind        text not null,             -- 'acte_naissance' | 'diplome' | 'photo' | 'cni' | 'releve_anterieur' | 'autre'
  title       text,
  url         text not null,
  size_mo     numeric,
  status      text default 'depose',     -- 'depose' | 'valide' | 'refuse'
  note_admin  text,
  uploaded_at timestamptz default now(),
  reviewed_by uuid,
  reviewed_at timestamptz
);
create index if not exists idx_sdoc_student on public.student_documents(student_id);
create index if not exists idx_sdoc_status on public.student_documents(status);
alter table public.student_documents enable row level security;
drop policy if exists "student_documents_all" on public.student_documents;
create policy "student_documents_all" on public.student_documents for all using (true) with check (true);
