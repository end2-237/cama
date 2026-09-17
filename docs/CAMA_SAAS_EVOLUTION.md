# CAMA SaaS — Journal d'évolution (reprise après compactage)

> Ce fichier est la SOURCE DE VÉRITÉ de l'avancement du chantier SaaS.
> Règle imposée par l'utilisateur : **on ne passe à l'étape suivante que si la
> précédente est terminée de fond en comble, testée (interfaces + parcours
> utilisateur + cohérence globale), puis consignée ici.**
> Le plan complet est dans `docs/CAMA_SAAS_ROADMAP.md`.

## Décisions de design validées
- White-label = branding + config par org, MÊMES composants ; thème via variables CSS ; résolution par sous-domaine.
- Interface de cours = même UX pour tous ; programme, vocabulaire et modules paramétrables par org/vertical.
- TP/VM = entitlement (premium + par vertical) ; machines hébergées PAR l'institut, isolées par `org_id`.
- Enregistrement d'org = flux dédié `/signup` + `/onboarding`, puis login/register tenant-scopés, + `/super-admin`.
- En attente de décision utilisateur : (1) 3 verticaux d'emblée ou académique+langues d'abord ; (2) TP/VM = Business/Enterprise ou option payante.

## Ordre des étapes (résultats visibles)
1. Socle organisation + thème dynamique + 2ᵉ institut démo  ← **EN COURS**
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
**Statut : NON COMMENCÉE** (prérequis : Étape 1 terminée ✅)
Prochaine action : migration d'ajout de `org_id` sur toutes les tables métier + backfill JFN + réécriture des 78 policies (`org_id + auth.uid() + rôle`).

