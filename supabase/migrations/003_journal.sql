-- ════════════════════════════════════════════════════════════
-- CAMA — Migration 003 : Journal de l'école (Le Journal JFN)
--        Articles éditoriaux multi-médias : texte, image, vidéo,
--        audio (podcast), reel, live. Alimente le fil d'actualités
--        du dashboard ET la page « Toutes les éditions ».
-- À coller dans Supabase → SQL Editor. Réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

drop table if exists public.journal_reactions cascade;
drop table if exists public.journal_articles  cascade;

-- ════════════════════════════════════════════════════════════
-- 1. ARTICLES DU JOURNAL
--    media_kind : none | image | video | audio | reel | live
--    Les colonnes média sont optionnelles selon le type.
-- ════════════════════════════════════════════════════════════
create table if not exists public.journal_articles (
  id            uuid primary key default gen_random_uuid(),
  rubrique      text not null default 'Campus',        -- À la une|Direct|Vie du campus|Scolarité|Podcast|Ressources|Sport|Culture|Tribune
  title         text not null,
  subtitle      text,
  body          text,
  -- Média principal
  media_kind    text not null default 'none',          -- none|image|video|audio|reel|live
  media_src     text,                                  -- URL image/poster/vidéo
  media_url     text,                                  -- URL ressource (mp4/mp3/lien live)
  media_legend  text,
  media_duration text,                                 -- "2:14", "18 min"…
  media_at      text,                                  -- pour live : "Demain · 10h00"
  -- Métadonnées éditoriales
  author        text not null default 'Rédaction JFN',
  cover_url     text,                                  -- grande image de Une (page éditions)
  tags          text[] default '{}',
  refs          jsonb  default '[]'::jsonb,            -- [{label, href}]
  cta_label     text,
  cta_href      text,
  featured      boolean not null default false,        -- « À la une »
  published     boolean not null default true,
  views         integer not null default 0,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_journal_published on public.journal_articles(published, created_at desc);
create index if not exists idx_journal_rubrique  on public.journal_articles(rubrique);

-- Recherche plein-texte française (pour CAMA Search interne)
alter table public.journal_articles
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('french',
      coalesce(title,'') || ' ' || coalesce(subtitle,'') || ' ' || coalesce(body,'') || ' ' || coalesce(rubrique,''))
  ) stored;
create index if not exists idx_journal_search on public.journal_articles using gin(search_vector);

-- ════════════════════════════════════════════════════════════
-- 2. RÉACTIONS (like / save) — interactions style insta/tiktok
-- ════════════════════════════════════════════════════════════
create table if not exists public.journal_reactions (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid not null references public.journal_articles(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  kind        text not null default 'like',            -- like|save
  created_at  timestamptz not null default now(),
  unique (article_id, user_id, kind)
);
create index if not exists idx_journal_react on public.journal_reactions(article_id);

-- RLS désactivé (mode prototype) — cohérent avec le reste du schéma.
alter table public.journal_articles  disable row level security;
alter table public.journal_reactions disable row level security;

-- ════════════════════════════════════════════════════════════
-- 3. SEED — premières éditions du Journal JFN
-- ════════════════════════════════════════════════════════════
insert into public.journal_articles
  (rubrique, title, subtitle, body, media_kind, media_src, media_legend, media_duration, media_at, author, cover_url, tags, refs, cta_label, cta_href, featured)
values
  ('À la une',
   'JFN parmi les 10 meilleures universités tech d''Afrique centrale',
   'Le classement QS Africa 2025 distingue l''institut pour l''informatique et l''ingénierie.',
   'L''Institut JFN se hisse à la 7e place du classement régional, porté par son taux d''insertion professionnelle de 84 % et le déploiement de la plateforme CAMA. Le jury salue « une approche pédagogique pensée pour les réalités d''infrastructure du continent ».',
   'image', 'https://jfn-univ.com/wp-content/uploads/2024/08/jfn-2.jpg', 'Le campus de Yaoundé lors de la rentrée 2025. © Presse JFN', null, null,
   'Rédaction JFN', 'https://jfn-univ.com/wp-content/uploads/2024/08/jfn-2.jpg',
   array['classement','excellence','cama'],
   '[{"label":"Classement QS Africa Universities 2025","href":"#"},{"label":"Communiqué officiel de l''Institut","href":"#"}]'::jsonb,
   'Lire l''article complet', '#', true),

  ('Direct',
   'TD Arbres binaires — INF201',
   'Classe virtuelle animée par Pr. Amina Bello, exercices 3.4 à 3.8 au programme.',
   'La séance sera enregistrée et le replay publié automatiquement dans le chapitre 2 du cours. Le mode audio seul est disponible pour les connexions faibles.',
   'live', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=640&q=70', null, null, 'Demain · 10h00',
   'Pr. Amina Bello', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=70',
   array['live','inf201','td'],
   '[{"label":"Cours INF201 — Structures de données","href":"/dashboard"}]'::jsonb,
   'Ajouter à mon planning', '#', false),

  ('Vie du campus',
   'Hackathon AfriCode 2025 : 48h pour l''agriculture digitale',
   '500 000 FCFA de dotation, inscriptions ouvertes jusqu''au 30 juin.',
   'Organisé par le Club Informatique avec le soutien de partenaires industriels, le hackathon réunira 120 étudiants autour de cas réels soumis par des coopératives agricoles de la région Centre. Équipes de 3 à 5, toutes filières confondues.',
   'video', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=640&q=70', 'Aftermovie de l''édition 2024', '2:14', null,
   'Club Informatique JFN', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=70',
   array['hackathon','concours','agritech'],
   '[{"label":"Règlement du concours (PDF)","href":"#"},{"label":"Formulaire d''inscription","href":"#"}]'::jsonb,
   'S''inscrire', '#', false),

  ('Scolarité',
   'Bourses d''excellence 2025–2026 : dépôt avant le 15 juillet',
   'Critères : moyenne ≥ 14/20, assiduité plateforme, dossier social.',
   'Le service Scolarité rappelle que les demandes se font exclusivement via le portail. Les relevés certifiés CAMA (QR) sont automatiquement joints au dossier — aucune copie papier n''est requise.',
   'none', null, null, null, null,
   'Service Scolarité', null,
   array['bourse','scolarite'],
   '[{"label":"Conditions d''éligibilité","href":"#"},{"label":"Portail des bourses","href":"#"}]'::jsonb,
   'Déposer mon dossier', '#', false),

  ('Podcast',
   '« Réussir sa L2 » — épisode 7 : gérer les checkpoints',
   'Conseils d''étudiants de L3 et du service pédagogique.',
   'Comment organiser sa semaine entre cours natifs, vidéos et lives ? Trois étudiants partagent leurs méthodes, suivis de l''analyse de Mme Essomba du service pédagogique.',
   'audio', null, 'Disponible en téléchargement léger (4 Mo)', '18 min', null,
   'Radio Campus JFN', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&q=70',
   array['podcast','methodologie'],
   '[{"label":"Tous les épisodes","href":"#"}]'::jsonb,
   'Écouter', '#', false),

  ('Ressources',
   '40 exercices corrigés d''algèbre linéaire ajoutés en MAT203',
   'Le département Mathématiques enrichit la bibliothèque numérique L2.',
   'Les corrigés sont disponibles en cours natif (0,05 Mo) et en PDF compressé. Chaque exercice est relié au chapitre correspondant et alimenté dans le Prof IA.',
   'reel', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=480&q=70', 'Aperçu des nouvelles ressources', '0:45', null,
   'Dép. Mathématiques', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=70',
   array['ressources','maths','mat203'],
   '[{"label":"Bibliothèque numérique — section MAT","href":"#"}]'::jsonb,
   'Consulter', '#', false);
