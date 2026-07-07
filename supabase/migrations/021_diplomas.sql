-- ════════════════════════════════════════════════════════════
-- 021_diplomas.sql — Diplômes & attestations (chantier E3)
--   • diplomas : documents officiels émis (licence | attestation | relevé)
--     avec code de vérification unique, révocables.
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create table if not exists public.diplomas (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null,
  kind           text not null default 'releve',   -- 'licence' | 'attestation' | 'releve'
  parcours_slug  text,
  parcours_title text,
  academic_year  text,
  level          text,
  code           text unique not null,
  average        numeric(4,2),
  mention        text,
  decision       text,
  issued_at      timestamptz default now(),
  issued_by      uuid,
  revoked        boolean default false,
  revoked_at     timestamptz
);
create index if not exists idx_diplomas_code on public.diplomas(code);
create index if not exists idx_diplomas_student on public.diplomas(student_id);
alter table public.diplomas enable row level security;
drop policy if exists "diplomas_all" on public.diplomas;
create policy "diplomas_all" on public.diplomas for all using (true) with check (true);
