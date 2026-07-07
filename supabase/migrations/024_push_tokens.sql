-- ════════════════════════════════════════════════════════════
-- 024 · Jetons de notification push (FCM / APNs) par appareil
-- Utilisés par l'app mobile Capacitor pour envoyer des push ciblés.
-- ════════════════════════════════════════════════════════════

create table if not exists push_tokens (
  token       text primary key,
  user_id     uuid not null,
  platform    text not null default 'web',   -- 'android' | 'ios' | 'web'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Défensif : ajoute les colonnes si la table préexiste partiellement.
alter table push_tokens add column if not exists user_id    uuid;
alter table push_tokens add column if not exists platform   text default 'web';
alter table push_tokens add column if not exists created_at timestamptz default now();
alter table push_tokens add column if not exists updated_at timestamptz default now();

create index if not exists idx_push_tokens_user on push_tokens(user_id);

alter table push_tokens enable row level security;

drop policy if exists push_tokens_all on push_tokens;
create policy push_tokens_all on push_tokens for all using (true) with check (true);
