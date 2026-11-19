/* ════════════════════════════════════════════════════════════
   CAMA — Terminologie par vertical (white-label sémantique).
   Un institut de langues ne parle pas de « semestres/ECTS » mais
   de « niveaux/modules ». Ces libellés adaptent l'interface au
   métier de chaque établissement, sans dupliquer de composants.
════════════════════════════════════════════════════════════ */

import type { DBCategory, OrgFamily } from "@/lib/org";

export interface Terms {
  platformLabel: string;   // sur-titre de marque
  heroLine1: string;       // accroche (2 lignes)
  heroLine2: string;
  heroTail: string;
  levelWord: string;       // « Niveau »
  groupWord: string;       // « Semestre » | « Module »
  unitWord: string;        // « UE » | « Unité » | « Compétence »
  creditWord: string;      // « ECTS » | « Crédit »
  programWord: string;     // « Cursus » | « Programme » | « Parcours »
}

const PACKS: Record<OrgFamily, Terms> = {
  academique: {
    platformLabel: "Plateforme Académique",
    heroLine1: "Construisez votre",
    heroLine2: "avenir académique",
    heroTail: "au Cameroun.",
    levelWord: "Niveau",
    groupWord: "Semestre",
    unitWord: "UE",
    creditWord: "ECTS",
    programWord: "Cursus",
  },
  langues: {
    platformLabel: "École de langues",
    heroLine1: "Maîtrisez une",
    heroLine2: "nouvelle langue",
    heroTail: "à votre rythme.",
    levelWord: "Niveau (A1→C2)",
    groupWord: "Module",
    unitWord: "Unité",
    creditWord: "Crédit",
    programWord: "Programme",
  },
  pro: {
    platformLabel: "Centre de formation pro",
    heroLine1: "Développez vos",
    heroLine2: "compétences pro",
    heroTail: "pour l'emploi.",
    levelWord: "Niveau",
    groupWord: "Module",
    unitWord: "Compétence",
    creditWord: "Crédit",
    programWord: "Parcours",
  },
};

/**
 * Le vocabulaire d'un établissement : celui de son modèle (famille), puis
 * celui de sa catégorie par-dessus (« Atelier », « Leçon », « Classe »…).
 */
export function termsFor(famille: OrgFamily | string, categorie?: Pick<DBCategory, "terms"> | null): Terms {
  const base = PACKS[famille as OrgFamily] ?? PACKS.academique;
  const propres = Object.fromEntries(
    Object.entries(categorie?.terms ?? {}).filter(([k, v]) => k in base && typeof v === "string" && v.trim()),
  );
  return { ...base, ...propres };
}
