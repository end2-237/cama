-- ════════════════════════════════════════════════════════════
-- 005_seed_chapters.sql — Chapitres de démonstration avec vidéo + transcription
-- À coller dans Supabase → SQL Editor.
-- Ajoute des chapitres avec de vraies transcriptions aux cours existants.
-- Ne fait RIEN si aucun cours n'existe encore (les INSERT sautent).
-- ════════════════════════════════════════════════════════════

-- On insère des chapitres pour le PREMIER cours trouvé (prototype).
-- Les transcriptions ci-dessous sont les mêmes que celles du mock db.ts
-- pour assurer la continuité.

do $$
declare
  cid uuid;
begin
  select id into cid from public.program_courses limit 1;
  if cid is null then return; end if;

  -- Supprime les anciens chapitres de démo s'il y en a pour ce cours
  -- (réexécutable sans danger).
  delete from public.course_chapters where program_course_id = cid;

  -- Chapitre 1 : Complexité algorithmique (vidéo + natif + PDF)
  insert into public.course_chapters (program_course_id, ordre, title, video, natif, pdf) values (
    cid, 1, 'Complexité algorithmique',
    '{"title":"Introduction à la complexité","durationMin":35,"sizeMo":42,"quality":"720p","transcript":"Bienvenue dans ce premier chapitre. La complexité algorithmique mesure l''efficacité d''un algorithme en fonction de la taille de l''entrée. La notation Big-O exprime la borne supérieure asymptotique : O(1) constant, O(log n) logarithmique, O(n) linéaire, O(n²) quadratique. Un tri à bulles est en O(n²) tandis qu''un tri fusion est en O(n log n). Pour illustrer : si n = 1000, un algorithme O(n²) effectue un million d''opérations, alors qu''un O(n log n) n''en fait qu''environ 10 000. Sur un téléphone d''entrée de gamme courant au Cameroun, cette différence est très concrète. La notation Theta donne une borne exacte, et Omega une borne inférieure. Dans la suite du cours nous analyserons des algorithmes classiques de tri, de recherche et de graphes, en les comparant par leur complexité temporelle et spatiale."}'::jsonb,
    '{"blocks":[{"type":"titre","text":"La notation Big-O"},{"type":"texte","text":"La complexité algorithmique est une mesure fondamentale en informatique qui permet d''évaluer l''efficacité d''un algorithme indépendamment du matériel."},{"type":"point","text":"O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) — retenez cet ordre, il guide tout choix d''algorithme."},{"type":"definition","terme":"Big-O (notation de Landau)","text":"Borne supérieure asymptotique du temps d''exécution. O(f(n)) signifie que le temps est au plus proportionnel à f(n) pour n suffisamment grand."},{"type":"quiz","question":"Quelle est la complexité du tri fusion ?","options":["O(n)","O(n log n)","O(n²)","O(log n)"],"bonne":1}]}'::jsonb,
    '{"name":"Complexité algorithmique — Support de cours.pdf","sizeMo":1.2,"pages":18}'::jsonb
  );

  -- Chapitre 2 : Arbres binaires de recherche (vidéo + natif)
  insert into public.course_chapters (program_course_id, ordre, title, video, natif) values (
    cid, 2, 'Arbres binaires de recherche',
    '{"title":"Comprendre les ABR","durationMin":28,"sizeMo":35,"quality":"720p","transcript":"Un arbre binaire de recherche est une structure où chaque nœud a au plus deux enfants : le sous-arbre gauche contient les valeurs inférieures, le droit les valeurs supérieures. La recherche, l''insertion et la suppression s''effectuent en O(log n) si l''arbre est équilibré. En revanche, un arbre dégénéré (tous les nœuds d''un côté) donne O(n). Pour éviter ce problème, on utilise les arbres AVL ou rouge-noir qui se rééquilibrent automatiquement après chaque insertion ou suppression grâce à des rotations. La rotation simple (gauche ou droite) et la rotation double sont les opérations fondamentales de rééquilibrage."}'::jsonb,
    '{"blocks":[{"type":"titre","text":"Les arbres binaires de recherche (ABR)"},{"type":"texte","text":"Un ABR organise les données pour permettre des recherches, insertions et suppressions efficaces."},{"type":"point","text":"Propriété fondamentale : pour tout nœud, les valeurs du sous-arbre gauche sont inférieures et celles du sous-arbre droit supérieures."},{"type":"definition","terme":"Arbre AVL","text":"Arbre binaire de recherche auto-équilibré : la différence de hauteur entre les sous-arbres gauche et droit de chaque nœud est au plus 1. Le rééquilibrage se fait par rotations."},{"type":"quiz","question":"Quelle est la complexité de la recherche dans un ABR équilibré ?","options":["O(n)","O(n²)","O(log n)","O(1)"],"bonne":2}]}'::jsonb
  );

  -- Chapitre 3 : Introduction au web (vidéo + natif)
  insert into public.course_chapters (program_course_id, ordre, title, video, natif) values (
    cid, 3, 'Développement web — HTML, CSS & JavaScript',
    '{"title":"Les bases du Web","durationMin":40,"sizeMo":48,"quality":"720p","transcript":"Le HTML structure le contenu, le CSS le met en forme. Une page bien construite est sémantique : header, nav, main, footer. Le responsive design adapte la mise en page à tous les écrans grâce aux media queries. JavaScript ajoute l''interactivité : manipulation du DOM, gestion des événements, appels réseau avec fetch(). Le DOM (Document Object Model) est une représentation arborescente de la page que le navigateur construit à partir du HTML. JavaScript peut traverser et modifier cet arbre pour réagir aux actions de l''utilisateur. Les frameworks modernes comme React, Vue ou Svelte facilitent la construction d''interfaces complexes en composants réutilisables."}'::jsonb,
    '{"blocks":[{"type":"titre","text":"HTML, CSS et JavaScript"},{"type":"texte","text":"Le trio fondamental du Web : HTML pour la structure, CSS pour la présentation, JavaScript pour le comportement."},{"type":"point","text":"Le DOM est l''interface entre le HTML et JavaScript — chaque élément de la page est un objet manipulable."},{"type":"definition","terme":"Responsive design","text":"Technique de conception web qui adapte automatiquement la mise en page à la taille de l''écran (mobile, tablette, desktop) grâce aux media queries CSS."},{"type":"quiz","question":"Que signifie DOM ?","options":["Data Object Method","Document Object Model","Digital Output Manager","Direct Object Mapping"],"bonne":1}]}'::jsonb
  );

end $$;
