# CAMA SaaS — Journal d'évolution (reprise après compactage)

> Ce fichier est la SOURCE DE VÉRITÉ de l'avancement du chantier SaaS.
> Règle imposée par l'utilisateur : **on ne passe à l'étape suivante que si la
> précédente est terminée de fond en comble, testée (interfaces + parcours
> utilisateur + cohérence globale), puis consignée ici.**
> Le plan complet est dans `docs/CAMA_SAAS_ROADMAP.md`.

## Décisions de design validées
- White-label = branding + config par org, MÊMES composants ; thème via variables CSS ; résolution par sous-domaine.
- **RÈGLE DESIGN (impérative) : toute nouvelle page reprend le design actuel comme référence — landing + surtout la page de connexion. JAMAIS de formulaire nu centré au milieu avec du vide : toujours un composant latéral (panneau `AuthPanel` à gauche via `grid lg:grid-cols-[42%_58%]`, ou équivalent illustratif) pour remplir l'espace. Réutiliser les classes existantes (btn-primary, border-border, text-ink/muted, animate-fade-*).**
- **RÈGLE DESIGN 2 (pages internes/app) : toute page interne (super-admin, facturation, programme…) utilise `PageShell` (src/components/dashboard/PageShell.tsx) = fil d'Ariane + barre `DashNav` + en-tête avec tuiles de statistiques (`PageStat[]`) + contenu. Doit correspondre EXACTEMENT au dashboard admin (navbar + métriques), sans laisser d'espace vide.**
- **FACTURATION : passerelle = PawaPay (Mobile Money agrégé Afrique — MTN MoMo, Orange Money, Airtel…). Décision utilisateur 2026-09-17.**
- Interface de cours = même UX pour tous ; programme, vocabulaire et modules paramétrables par org/vertical.
- TP/VM = entitlement (premium + par vertical) ; machines hébergées PAR l'institut, isolées par `org_id`.
- **Décisions utilisateur (2026-09-17) : (1) les 3 verticaux dès le départ (académique, langues, pro) ; (2) TP/VM = vertical pro/IT ET palier Business/Enterprise (sinon masqué), avec override par org (JFN académique le garde car déjà utilisé) ; (3) enchaîner Étapes 4 et 5 sans s'arrêter ; (4) adressage : garder `?org=` (pas de DNS réel pour l'instant).**
- Enregistrement d'org = flux dédié `/signup` + `/onboarding`, puis login/register tenant-scopés, + `/super-admin`.
- En attente de décision utilisateur : (1) 3 verticaux d'emblée ou académique+langues d'abord ; (2) TP/VM = Business/Enterprise ou option payante.

## Ordre des étapes (résultats visibles)1. Socle organisation + thème dynamique + 2ᵉ institut démo  ← **EN COURS**
2. Isolation des données (org_id partout + RLS réelle)
3. Pages d'enregistrement d'établissement (/signup, /onboarding)
4. Entitlements / modules à la carte (TP/VM affiché ou non)
5. Programme paramétrable par vertical (langues A1→C2, pro)

---

## Étape 1 — Socle organisation + thème dynamique
**Statut : EN COURS**

### Objectif
Deux instituts sur la même app, chacun avec son logo et ses couleurs, résolus par sous-domaine.

### Livrables
- [ ] Migration `026_organizations.sql` : table `organizations` (branding + vertical + subdomain + plan/status) + RLS lecture publique du branding + seed JFN + seed institut démo.
- [ ] `src/lib/theme.ts` : génération d'une échelle de couleurs à partir d'une couleur de marque + application en variables CSS (compatible opacités Tailwind).
- [ ] `tailwind.config.ts` : palette `cama`/`gold` en `rgb(var(--…) / <alpha-value>)`.
- [ ] `src/app/globals.css` : `:root` avec les canaux par défaut (JFN).
- [ ] `src/lib/org.ts` : type `DBOrganization`, `fetchOrgBySubdomain`, `fetchOrgById`, résolution du sous-domaine (+ override `?org=` pour test).
- [ ] `src/context/OrgContext.tsx` : provider qui résout l'org, applique le thème, expose org+logo ; fallback intégré (jfn, demo) si DB indisponible.
- [ ] `src/app/layout.tsx` : intégration du `OrgProvider`.

### Tests à faire avant de clôturer
- [ ] `tsc --noEmit` OK.
- [ ] Cohérence : les classes `bg-cama`, `bg-cama/20`, `text-cama-700`, `bg-gold` rendent toujours correctement (opacités incluses).
- [ ] Parcours : `?org=jfn` → identité JFN ; `?org=demo` → identité démo (couleurs + logo différents) sur les mêmes écrans.
- [ ] Aucune régression visuelle sur les pages existantes en l'absence d'org (fallback JFN).

## Étape 1 — Socle organisation + thème dynamique
**Statut : TERMINÉE ✅ (testée, cohérente)**

### Objectif
Deux instituts sur la même app, chacun avec son logo et ses couleurs, résolus par sous-domaine.

### Livrables
- [x] Migration `026_organizations.sql` : table `organizations` (branding + vertical + subdomain + plan/status) + RLS lecture publique + seed JFN + seed institut démo (LinguaPro Academy).
- [x] `src/lib/theme.ts` : `buildScale`/`buildAccent`/`applyTheme`/`resetTheme` — échelle 50→900 générée depuis une couleur de marque, écrite en canaux CSS.
- [x] `tailwind.config.ts` : palette `cama`/`gold` en `rgb(var(--…) / <alpha-value>)`.
- [x] `src/app/globals.css` : `:root` avec les canaux par défaut (JFN).
- [x] `src/lib/org.ts` : `DBOrganization`, `resolveOrgSlug` (sous-domaine + `?org=`), `fetchOrgBySlug`/`fetchOrgById`, `FALLBACK_ORGS` (jfn, demo).
- [x] `src/context/OrgContext.tsx` : provider résout l'org, applique le thème, expose `org`/`loading`/`reload` ; fallback synchrone immédiat.
- [x] `src/app/layout.tsx` : `OrgProvider` englobe `AuthProvider`.
- [x] `src/components/auth/AuthPanel.tsx` : nom de l'établissement câblé via `useOrg`.

### Tests réalisés
- [x] `tsc --noEmit` OK (seule erreur préexistante : `capacitor.config.ts`, hors périmètre).
- [x] Opacités préservées : `bg-cama/20`, `text-cama-700`, `bg-gold` rendent correctement après passage en variables.
- [x] Parcours vérifié par capture réelle (Chromium) : `?org=jfn` → identité indigo « Institut JFN » ; `?org=demo` → identité teal « LinguaPro Academy » (bouton, onglets, liens recolorés). Mêmes écrans, deux marques.
- [x] Aucune régression : sans org, fallback JFN = rendu d'origine identique.

### Journal
- 2026-09-17 : Étape 1 implémentée et validée par capture d'écran des 2 tenants sur `/auth/login`. Le thème recolore toute l'app depuis une seule couleur de marque.
- NB (renvoyé à l'Étape 5) : les textes « Plateforme Académique / avenir académique » restent académiques — la terminologie par vertical (langues/pro) sera paramétrée à l'Étape 5. L'Étape 1 ne couvre que branding couleurs + nom/logo.
- Env de dev : `.env.local` avec placeholders Supabase (non versionné) pour permettre le boot local ; les données réelles viennent de la migration une fois appliquée.

---

## Étape 2 — Isolation des données (org_id + RLS réelle)
**Statut : TERMINÉE ✅ (testée sur Postgres réel)**

### Objectif
Chaque établissement ne voit et ne modifie que ses propres données, garanti côté base.

### Livrables
- [x] `027_tenant_org_id.sql` — `org_id` ajouté à 61 tables métier + backfill JFN + index ;
      fonctions `current_org_id()`, `current_user_role()` ; défaut auto `org_id = current_org_id()`
      à l'insertion (sauf `users`, peuplé par l'app).
- [x] `028_tenant_rls.sql` — RLS activée sur toutes les tables ; policy `tenant_isolation`
      (`org_id = current_org_id()`), règles spécifiques `users` (profil propre + membres du tenant),
      `is_platform_admin()` (super-admin transverse).
- [x] `src/app/auth/register/page.tsx` — insertion `users` et `inscriptions` avec `org_id` du tenant courant (via `useOrg`).
- [x] `src/lib/supabase.ts` — `DBUser.org_id` ajouté.

### Tests réalisés (Postgres 16 local, rôle `authenticated`, JWT simulé)
- [x] Chaîne complète rejouée depuis zéro : schema + 27 migrations → 0 table sans `org_id` (hors `organizations`), 0 table tenant sans RLS.
- [x] Isolation lecture : Alice (JFN) ne voit que les données JFN ; Bob (LinguaPro) que celles de LinguaPro. Données de l'autre org invisibles (0 ligne).
- [x] Auto-remplissage : insertion sans `org_id` → prend le tenant courant automatiquement.
- [x] Anti-fuite écriture : Bob tentant d'insérer dans l'org JFN → **refusé** (`new row violates row-level security policy`).
- [x] Super-admin plateforme (`admin_level='super_admin'`) → voit les 2 orgs.
- [x] `tsc --noEmit` propre.

### Journal
- 2026-09-17 : Étape 2 (2a colonnes+backfill, 2b RLS, 2c câblage register) implémentée et validée sur une reproduction Postgres réelle de la base (stubs auth/storage/realtime). Isolation lecture + écriture confirmée avec 2 tenants.
- NB : les routes API service-role continuent de contourner la RLS (normal). Les pages publiques (landing) ne touchent pas la base ; le journal est derrière login. Aucun impact public.
- À prévoir Étape 3 : quand un visiteur non connecté doit voir un catalogue public par sous-domaine, prévoir une lecture publique filtrée par org (passage de l'org au serveur).

---

## Étape 3 — Pages d'enregistrement d'établissement (/signup, /onboarding)
**Statut : TERMINÉE ✅ (logique testée sur Postgres réel, UI capturée)**

### Objectif
Créer un établissement + son admin depuis l'interface, puis arriver sur un espace marqué.

### Livrables
- [x] `029_org_admin.sql` — policies : l'admin d'un org peut modifier SON org ; suppression réservée au super-admin plateforme.
- [x] `src/app/api/org/signup/route.ts` — API service-role : valide (slug/réservés/mot de passe), crée `organizations` + compte Auth admin + profil `users` (org_id), rollback si échec.
- [x] `src/app/signup/page.tsx` — formulaire public « Créer votre établissement » (nom, sous-domaine, vertical, couleur de marque, admin).
- [x] `src/app/onboarding/page.tsx` — écran de bienvenue post-création, branding appliqué, lien vers l'espace.

### Tests réalisés
- [x] `tsc --noEmit` propre.
- [x] Simulation du flux signup sur Postgres réel : création org « Test School » + admin → le nouvel admin ne voit QUE son org (isolation confirmée, aucune donnée JFN/LinguaPro).
- [x] Rendu UI capturé : `/signup` (formulaire complet) et `/onboarding?org=demo` (branding teal appliqué).
- [x] Chaîne complète (schema + 28 migrations) rejouée sans erreur.

### Journal
- 2026-09-17 : Étape 3 implémentée. Flux de création d'établissement côté serveur (service-role) + pages publiques. Isolation du tenant créé validée sur base réelle.
- NB : l'exécution end-to-end réelle de l'API nécessite `SUPABASE_SERVICE_ROLE_KEY` (déjà utilisée par les routes admin existantes) ; non disponible en local, mais la logique SQL (org+admin+isolation) est prouvée sur Postgres.
- À prévoir : provisioning DNS réel des sous-domaines (hors code) ; page de réglages d'org (édition branding) — la policy d'update est déjà en place.

---

## Étape 4 — Entitlements / modules à la carte (TP/VM affiché ou non)
**Statut : TERMINÉE ✅ (logique testée, migration validée)**

### Objectif
Activer/désactiver des modules par établissement ; démonstration sur TP/VM (pro/IT + palier).

### Livrables
- [x] `030_org_features.sql` — colonne `features text[]` + paliers par défaut (JFN business + override `tp_vm`, demo starter).
- [x] `src/lib/features.ts` — `orgFeatures(org)`/`hasFeature()` : socle commun + TP/VM si (vertical=pro ET plan Business/Enterprise) + overrides explicites par org.
- [x] `src/lib/org.ts` — `DBOrganization.features` ; fallbacks JFN(business, tp_vm) / demo(starter).
- [x] `src/context/OrgContext.tsx` — expose `has(key)`.
- [x] `src/components/dashboard/DashNav.tsx` — masque les entrées `/tp` si pas de `tp_vm`.
- [x] `src/app/tp/page.tsx` — garde d'accès : message « module non activé » si pas de `tp_vm`.

### Tests réalisés
- [x] Logique features : JFN → tp_vm OUI ; demo(langues/starter) → NON ; pro+business → OUI ; pro+starter → NON.
- [x] Migration 030 appliquée : `jfn {tp_vm}`, `demo {}`.
- [x] `tsc --noEmit` propre.

### Journal
- 2026-09-17 : Étape 4 — modules à la carte. TP/VM gaté par vertical(pro) + palier(business/enterprise), override par org (JFN le garde). Nav + page /tp gardées.
- Règle appliquée : styles de formulaire = référence login (input-auth + bouton login) ; icône bâtiment retirée du /signup.

---

## Étape 5 — Programme paramétrable par vertical (terminologie)
**Statut : TERMINÉE ✅ (couche terminologie — testée, capturée)**

### Objectif
Adapter l'interface au métier de chaque établissement (académique / langues / pro) sans dupliquer de composants.

### Livrables
- [x] `src/lib/terminology.ts` — packs par vertical (platformLabel, accroche héro, levelWord/groupWord/unitWord/creditWord/programWord).
- [x] `src/context/OrgContext.tsx` — expose `terms` (selon `org.vertical`).
- [x] `src/components/auth/AuthPanel.tsx` — sur-titre + accroche pilotés par la terminologie (corrige le texte « académique » figé signalé précédemment).

### Tests réalisés
- [x] `tsc --noEmit` propre.
- [x] Capture : `?org=jfn` → « Plateforme Académique / avenir académique » ; `?org=demo` → « École de langues / Maîtrisez une nouvelle langue ». Même écran, sémantique adaptée.

### Journal
- 2026-09-17 : Étape 5 (terminologie par vertical) livrée. Les libellés métier (`terms`) sont disponibles partout via `useOrg()` pour les prochaines pages.

---

## Étape 6 (recommandée) — Constructeur de programme en base
**Statut : NON COMMENCÉE**
La terminologie est en place (Étape 5). Reste à externaliser le programme lui-même :
`PARCOURS` (codé en dur, `src/lib/parcours.ts`) → tables par org (`program_levels`, `program_modules`)
+ page admin de création + bascule du register/programme sur les données de l'org (fallback JFN).
Chantier large et transverse (register, /admin/programme, /etudiant/programme…) : à faire avec
validation UI étape par étape pour ne pas casser JFN. Les `terms` de l'Étape 5 y seront réutilisés.


---

## Facturation — PawaPay (Mobile Money)
**Statut : TERMINÉE ✅ au niveau code + logique (encaissement réel = clés à fournir)**

### Livrables
- [x] `031_billing.sql` — `plans` (catalogue global, lecture publique), `subscriptions` & `subscription_payments` (org_id + RLS tenant) ; seed plans (Starter/Pro/Business/Enterprise) + abonnements JFN(business/active), demo(starter/trial).
- [x] `src/lib/pawapay.ts` (serveur) — `initiateDeposit()` (POST /deposits), `getDepositStatus()`, correspondents MTN_MOMO_CMR / ORANGE_CMR ; jeton lu côté serveur uniquement.
- [x] `src/lib/billing.ts` (client) — plans, abonnement, paiements, quota étudiants, `formatFcfa`.
- [x] `src/app/api/billing/checkout/route.ts` — service-role : vérifie l'admin, crée le paiement (pending), lance le dépôt PawaPay.
- [x] `src/app/api/billing/webhook/route.ts` — revérifie l'état auprès de PawaPay puis active l'abonnement si COMPLETED.
- [x] `src/app/admin/facturation/page.tsx` — page en `PageShell` (métriques : plan, statut, étudiants/quota, échéance) + cartes de plans + formulaire Mobile Money + historique. Style dashboard admin, sans vide.
- [x] `DashNav` — entrée admin « Abonnement ».

### Tests réalisés
- [x] Migration 031 appliquée ; chaîne complète (schema + 30 migrations) rejouée sans erreur.
- [x] Flux simulé sur Postgres réel : paiement pending → webhook COMPLETED → abonnement demo passe **starter/trial → pro/active**, paiement marqué payé.
- [x] `tsc --noEmit` propre.

### À fournir pour encaisser réellement (hors code)
- `PAWAPAY_API_TOKEN` (+ `PAWAPAY_ENV=sandbox|production`), `SUPABASE_SERVICE_ROLE_KEY` en prod.
- URL du webhook à déclarer dans le tableau de bord PawaPay → `/api/billing/webhook`.
- Pays/opérateurs à activer (Cameroun MTN/Orange par défaut).
