-- ════════════════════════════════════════════════════════════
-- 023_paiements.sql — Frais de scolarité & encaissements (chantier B3)
--   TRACE ADMINISTRATIVE seule (pas de paiement en ligne).
--   • fee_schedules : barèmes de frais par parcours/cycle/année
--   • invoices      : factures émises aux étudiants
--   • payments      : encaissements enregistrés par l'administration
--   • scholarships  : bourses / réductions accordées
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create table if not exists public.fee_schedules (
  id            uuid primary key default gen_random_uuid(),
  parcours_slug text,
  cycle_type    text,
  academic_year text,
  total_fcfa    int not null default 0,
  installments  int default 1,
  created_at    timestamptz default now()
);
alter table public.fee_schedules enable row level security;
drop policy if exists "fee_schedules_all" on public.fee_schedules;
create policy "fee_schedules_all" on public.fee_schedules for all using (true) with check (true);

create table if not exists public.invoices (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null,
  academic_year text,
  label         text,
  amount_fcfa   int not null default 0,
  due_date      date,
  status        text default 'du',        -- 'du' | 'partiel' | 'paye' | 'annule'
  created_at    timestamptz default now()
);
create index if not exists idx_invoices_student on public.invoices(student_id);
alter table public.invoices enable row level security;
drop policy if exists "invoices_all" on public.invoices;
create policy "invoices_all" on public.invoices for all using (true) with check (true);

create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid references public.invoices(id) on delete cascade,
  student_id  uuid not null,
  amount_fcfa int not null,
  method      text default 'especes',     -- 'especes' | 'mobile_money' | 'virement'
  reference   text,
  paid_at     timestamptz default now(),
  recorded_by uuid
);
create index if not exists idx_payments_invoice on public.payments(invoice_id);
alter table public.payments enable row level security;
drop policy if exists "payments_all" on public.payments;
create policy "payments_all" on public.payments for all using (true) with check (true);

create table if not exists public.scholarships (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null,
  academic_year text,
  kind          text,
  percent       int,
  amount_fcfa   int,
  note          text,
  granted_by    uuid,
  created_at    timestamptz default now()
);
create index if not exists idx_scholarships_student on public.scholarships(student_id);
alter table public.scholarships enable row level security;
drop policy if exists "scholarships_all" on public.scholarships;
create policy "scholarships_all" on public.scholarships for all using (true) with check (true);
