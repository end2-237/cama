-- ════════════════════════════════════════════════════════════
-- 015_notifications.sql — Notifications utilisateur CAMA
--   • cloche de la barre de navigation (badge non-lus + realtime)
--   • émetteurs : inscriptions, délibérations, messagerie interne
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  kind        text not null,           -- ex. 'inscription', 'resultat', 'message', 'live'
  title       text not null,
  body        text,
  link        text,                    -- route interne cliquable (ex. '/messagerie')
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notif_user_read on public.notifications(user_id, read_at);
alter table public.notifications enable row level security;
drop policy if exists "notifications_all" on public.notifications;
create policy "notifications_all" on public.notifications for all using (true) with check (true);

-- Realtime (INSERT poussés vers la cloche)
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
