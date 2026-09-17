-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Facturation — plans, abonnements, paiements PawaPay
-- Plans = catalogue global (lecture publique). Abonnements & paiements
-- = par établissement (org_id + RLS). Les webhooks PawaPay écrivent via
-- le service role (bypass RLS). Idempotent.
-- ════════════════════════════════════════════════════════════

-- ── Catalogue de plans (global) ──
create table if not exists public.plans (
  id          text primary key,               -- 'starter' | 'pro' | 'business' | 'enterprise'
  name        text not null,
  price_fcfa  integer not null default 0,     -- 0 = sur devis
  max_students integer,                        -- null = illimité
  sort        integer not null default 0
);

insert into public.plans (id, name, price_fcfa, max_students, sort) values
  ('starter',    'Starter',      600000,   150, 1),
  ('pro',        'Pro',         1500000,   500, 2),
  ('business',   'Business',    3600000,  1500, 3),
  ('enterprise', 'Enterprise',        0,  null, 4)
on conflict (id) do update
  set name = excluded.name, price_fcfa = excluded.price_fcfa,
      max_students = excluded.max_students, sort = excluded.sort;

alter table public.plans enable row level security;
drop policy if exists "plans_public_read" on public.plans;
create policy "plans_public_read" on public.plans for select using (true);

-- ── Abonnement de l'établissement ──
create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default public.current_org_id() references public.organizations(id),
  plan_id       text not null references public.plans(id),
  status        text not null default 'trial'
                check (status in ('trial','active','past_due','canceled')),
  period_end    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists subscriptions_org_idx on public.subscriptions(org_id);

-- ── Paiements d'abonnement (PawaPay) ──
create table if not exists public.subscription_payments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default public.current_org_id() references public.organizations(id),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id       text references public.plans(id),
  amount        integer not null,
  currency      text not null default 'XAF',
  provider      text not null default 'pawapay',
  provider_ref  text,                          -- depositId PawaPay
  phone         text,
  operator      text,                          -- correspondent (MTN_MOMO_CMR…)
  status        text not null default 'pending'
                check (status in ('pending','completed','failed')),
  created_at    timestamptz not null default now()
);
create index if not exists sub_payments_org_idx on public.subscription_payments(org_id);
create index if not exists sub_payments_ref_idx on public.subscription_payments(provider_ref);

-- ── RLS : isolation par établissement (service role bypass pour webhooks) ──
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

drop policy if exists "subscriptions_tenant" on public.subscriptions;
create policy "subscriptions_tenant" on public.subscriptions for all
  using (org_id = public.current_org_id() or public.is_platform_admin())
  with check (org_id = public.current_org_id() or public.is_platform_admin());

drop policy if exists "sub_payments_tenant" on public.subscription_payments;
create policy "sub_payments_tenant" on public.subscription_payments for all
  using (org_id = public.current_org_id() or public.is_platform_admin())
  with check (org_id = public.current_org_id() or public.is_platform_admin());

-- ── Abonnements initiaux (alignés sur les orgs de démonstration) ──
insert into public.subscriptions (org_id, plan_id, status, period_end)
select o.id, 'business', 'active', now() + interval '1 year'
  from public.organizations o where o.slug = 'jfn'
  and not exists (select 1 from public.subscriptions s where s.org_id = o.id);

insert into public.subscriptions (org_id, plan_id, status, period_end)
select o.id, 'starter', 'trial', now() + interval '14 days'
  from public.organizations o where o.slug = 'demo'
  and not exists (select 1 from public.subscriptions s where s.org_id = o.id);
