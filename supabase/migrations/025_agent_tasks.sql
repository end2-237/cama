-- ════════════════════════════════════════════════════════════
-- 025_agent_tasks.sql — Tâches de l'Agent d'administration
--   • File d'exécution semi-autonome : l'agent PROPOSE un plan (étapes),
--     l'admin APPROUVE, le serveur EXÉCUTE en arrière-plan et écrit la
--     progression ici. Le panneau « Tâches » lit cette table en temps réel.
--   • L'agent n'agit que dans le périmètre de l'admin ; tout est tracé.
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create table if not exists public.agent_tasks (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null,
  kind        text not null,                 -- ex. 'rentree_inscriptions'
  title       text not null,
  status      text not null default 'planifie', -- planifie | en_cours | termine | echoue | annule
  steps       jsonb not null default '[]'::jsonb, -- [{id,label,action,target_id,params,selected,status,result}]
  progress    int  not null default 0,       -- étapes traitées
  total       int  not null default 0,       -- étapes sélectionnées à traiter
  summary     text,                          -- compte rendu final
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_agent_tasks_admin on public.agent_tasks(admin_id, created_at desc);
create index if not exists idx_agent_tasks_status on public.agent_tasks(status);

alter table public.agent_tasks enable row level security;
drop policy if exists "agent_tasks_all" on public.agent_tasks;
create policy "agent_tasks_all" on public.agent_tasks for all using (true) with check (true);

-- Realtime (progression poussée vers le panneau « Tâches »)
do $$
begin
  alter publication supabase_realtime add table public.agent_tasks;
exception when duplicate_object then null;
end $$;
