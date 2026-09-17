# CAMA — Plan permanent : passage au SaaS multi-établissements

> Document de référence mémorisé. Objectif : transformer CAMA (app mono-institut)
> en SaaS multi-tenant vendable aux instituts (langues, formation professionnelle,
> académique). Basé sur l'analyse du code : 24 migrations, ~50 tables, 78 policies
> RLS (majoritairement permissives `using(true)`), ~38 000 lignes.

## Notes de départ
- Produit actuel (mono-institut) : **8/10**
- Readiness SaaS multi-établissements : **3,5/10**
- Effort estimé au 1er SaaS vendable : **6–10 semaines**

## Cible économique
- Modèle : **SaaS abonnement annuel** (pas vente de licence). Option on-premise annuelle pour gros clients.
- Tarifs/an (FCFA) : Starter ≤150 étud. = 600 000 · Pro ≤500 = 1 500 000 · Business ≤1 500 = 3 600 000 · Enterprise = devis 6 M+.
- Leviers : frais d'activation 250–500 k · modules IA en option (+30 %) · alt. 3–5 k/étudiant/an · −15/−20 % engagement 2–3 ans.
- Coût d'exploitation pour 20 clients Pro (~10 000 étudiants) : **3,5–8,6 M FCFA/an** (IA = poste variable clé) ; revenu 30 M ⇒ marge brute 71–88 % ; équilibre infra dès 3–4 clients Pro.

## Les 3 chantiers (piliers plateforme)
1. **Multi-tenant + RLS réelle** (verrou n°1, non négociable)
2. **Facturation récurrente** (verrou n°2, conditionne le modèle)
3. **Parcours paramétrable / white-label** (ouvre langues + pro)

## Feuille de route
### Phase 1 — Fondation multi-tenant & sécurité (S1–4, CRITIQUE)
- Migration : table `organizations` + `org_id` sur toutes les tables métier (+ backfill).
- Réécriture des 78 policies RLS : patron `org_id + auth.uid() + rôle`, répliqué.
- Injection `org_id` à la connexion (claims/session) + dans `src/lib/*`.
- Retrait de l'auth démo en clair (`src/lib/auth.ts`) ; 100 % Supabase Auth.

### Phase 2 — Facturation & abonnement (S4–6, HAUTE) — nécessite comptes externes
- Passerelle CinetPay/Flutterwave + Orange Money/MTN MoMo (webhooks).
- Modèle abonnement : plans, quotas étudiants, essai, suspension impayé.
- Reçus/factures auto + tableau de bord facturation.

### Phase 3 — Paramétrage & white-label (S6–8, HAUTE)
- Cycles/niveaux configurables (langues A1→C2, modules pro), barèmes, règles délib.
- Documents/attestations personnalisables par institut (vérifiables par code).
- Onboarding self-service (institut, admin initial, sous-domaine, logo/couleurs/langue).

### Phase 4 — Exploitation, pilotes & lancement (S8–10)
- Super-admin, sauvegardes, monitoring, audit cloisonné par tenant, RGPD.
- 1–2 pilotes à tarif réduit → études de cas → montée en prix.
- Documentation, support, page tarifs.

## Ce que Claude peut exécuter maintenant (sans comptes externes)
- Tout Phase 1 (tenant + RLS + wiring + retrait auth démo).
- Modèle de données Phase 2 (tables `plans`, `subscriptions`, `usage_quotas`) — hors intégration passerelle réelle.
- Modèle de données Phase 3 (config de cursus paramétrable) + super-admin scaffolding.
- Note projetée après le "faisable maintenant" : **~6–6,5/10** (reste : passerelle de paiement réelle + provisioning sous-domaine + pilotes).

## Bloqué sur intervention humaine / externe
- Clés API passerelle (CinetPay/Flutterwave), comptes marchands Mobile Money.
- DNS / provisioning sous-domaines.
- Recrutement pilotes, cadre légal société.
