-- ════════════════════════════════════════════════════════════════════
-- 004_chat.sql — Messagerie & forums CAMA
-- À coller dans Supabase → SQL Editor.
--
-- Couvre TOUS les chats de l'app :
--   • dm_messages    : conversations privées étudiant ↔ enseignant (DiscussionsDock)
--   • forum_messages : forums de classe par UE / par cours (DiscussionsDock + ForumPanel cours)
--   • community_messages : mur communautaire étudiant (page /journal)
-- ════════════════════════════════════════════════════════════════════

-- ── Conversations privées étudiant ↔ enseignant ──────────────────────
create table if not exists dm_messages (
  id           uuid primary key default gen_random_uuid(),
  thread_key   text not null,                 -- ex: "amina" ou "<student_id>:<teacher_slug>"
  teacher_slug text not null,                 -- enseignant cible (amina, kameni, essomba…)
  student_id   uuid references auth.users(id) on delete cascade,
  sender       text not null check (sender in ('moi','prof','etudiant','enseignant')),
  author_name  text,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_dm_thread on dm_messages (thread_key, created_at);

-- ── Forums de classe (par UE / code de cours) ────────────────────────
create table if not exists forum_messages (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null default 'ue',     -- 'ue' | 'course'
  channel     text not null,                  -- code UE (INF201…) ou id de cours
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null,
  role        text not null default 'etudiant',
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_forum_channel on forum_messages (channel, created_at);

-- ── Mur communautaire étudiant (page Journal) ────────────────────────
create table if not exists community_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null,
  avatar      text default '#7C3AED',
  body        text not null,
  likes       int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_community_created on community_messages (created_at desc);

-- ── Mode prototype : RLS désactivé (cohérent avec les autres tables) ──
alter table dm_messages        disable row level security;
alter table forum_messages     disable row level security;
alter table community_messages disable row level security;

-- ── Données de démonstration ─────────────────────────────────────────
insert into forum_messages (scope, channel, author_name, role, body) values
  ('ue', 'INF201', 'Marie K.',          'etudiant',   'Quelqu''un a compris l''exercice 4 du TD ? Je bloque sur la complexité.'),
  ('ue', 'INF201', 'Pr. Amina Bello',   'enseignant', 'Relisez le théorème maître, c''est la clé. Je détaillerai au live de vendredi.'),
  ('ue', 'INF202', 'Dr. Paul Kameni',   'enseignant', 'Le TP de jeudi portera sur les jointures. Révisez le chapitre 3 avant la séance.')
on conflict do nothing;

insert into community_messages (author_name, avatar, body, likes) values
  ('Amine B.',     '#7C3AED', 'Quelqu''un a les corrigés du TP3 réseaux ?', 4),
  ('Fatima N.',    '#0EA5E9', 'Le hackathon c''est trop bien organisé cette année !', 12),
  ('Jean-Paul M.', '#16A34A', 'Qui participe au live INF201 demain ?', 7),
  ('Diane A.',     '#DB2777', 'La certification AWS vaut le coup, je l''ai passée le mois dernier.', 19),
  ('Yves K.',      '#D97706', 'RDV à la cafet à 12h30 pour le club dev mobile', 3)
on conflict do nothing;
