/* ════════════════════════════════════════════════════════════
   CAMA — Données des parcours académiques (Institut JFN)
   Modèle riche : cycles, programme par année, types de cours,
   tarifs FCFA, campus, opportunités, cours intermédiaires.
════════════════════════════════════════════════════════════ */

export type CycleId = "presentiel" | "hybride" | "online";

export interface Cycle {
  id:        CycleId;
  label:     string;
  tagline:   string;
  /** Multiplicateur appliqué au tarif de base */
  factor:    number;
  highlights: string[];
}

export interface CourseTypeInfo {
  id:    "video" | "pdf" | "plateforme" | "live";
  label: string;
  desc:  string;
}

export interface UE {
  code:    string;
  title:   string;
  ects:    number;
  type:    CourseTypeInfo["id"][];   // modalités du cours
  devoirs: string;                   // évaluation
}

export interface Semestre {
  nom:  string;     // "Semestre 1"
  ues:  UE[];
}

export interface Annee {
  niveau: string;   // "L1", "L2"...
  titre:  string;   // "Première année — Tronc commun"
  semestres: Semestre[];
}

export interface Opportunite {
  pays:   string;
  flag:   string;
  partenaire: string;
  detail: string;
}

export interface Parcours {
  slug:        string;
  title:       string;
  school:      string;
  cycleType:   "Licence" | "Master";
  level:       string;          // "L1 → L3"
  duration:    string;          // "3 ans · 6 semestres"
  totalEcts:   number;
  image:       string;
  tagline:     string;
  description: string;
  diplome:     string;
  /** Tarif annuel de base en FCFA (cycle présentiel) */
  basePriceFcfa: number;
  fraisDossier:  number;
  annees:        Annee[];
  opportunites:  Opportunite[];
  debouches:     string[];
}

/* ── Cycles communs à tous les parcours ── */
export const CYCLES: Cycle[] = [
  {
    id:      "presentiel",
    label:   "Présentiel",
    tagline: "100% sur le campus de Yaoundé",
    factor:  1,
    highlights: [
      "Cours en amphi et travaux pratiques en salle",
      "Accès bibliothèque, laboratoires et coworking",
      "Encadrement direct par les enseignants",
      "Vie associative et événements campus",
    ],
  },
  {
    id:      "hybride",
    label:   "Hybride",
    tagline: "Mix présentiel + distanciel",
    factor:  0.82,
    highlights: [
      "2 à 3 jours sur le campus par semaine",
      "Cours théoriques en ligne, TP en présentiel",
      "Flexibilité pour les étudiants salariés",
      "Examens surveillés sur le campus",
    ],
  },
  {
    id:      "online",
    label:   "100% En ligne",
    tagline: "Étudiez depuis n'importe où",
    factor:  0.58,
    highlights: [
      "Cours vidéo et PDF en accès permanent",
      "Lives hebdomadaires avec les enseignants",
      "Examens sécurisés par proctoring IA",
      "Optimisé pour les connexions bas-débit",
    ],
  },
];

/* ── Types de cours (cahier des charges) ── */
export const COURSE_TYPES: CourseTypeInfo[] = [
  { id: "video",      label: "Cours vidéo",        desc: "Capsules vidéo téléchargeables, optimisées bas-débit, visionnables hors-ligne." },
  { id: "pdf",        label: "Supports PDF",        desc: "Polycopiés, fiches de TD et annales téléchargeables pour réviser sans connexion." },
  { id: "plateforme", label: "Cours plateforme",    desc: "Modules interactifs, quiz auto-corrigés et suivi de progression sur CAMA." },
  { id: "live",       label: "Lives enseignants",   desc: "Séances en direct avec les enseignants, questions-réponses et corrections." },
];

/* ── Cours intermédiaires (hors parcours) ── */
export interface CoursIntermediaire {
  slug:   string;
  title:  string;
  desc:   string;
  gratuit: boolean;
  prix?:  number;     // FCFA si payant
  duree:  string;
  emoji:  string;
}

export const COURS_INTERMEDIAIRES: CoursIntermediaire[] = [
  { slug: "anglais",    title: "Anglais académique",      desc: "Préparation TOEFL/IELTS pour vos opportunités à l'étranger.", gratuit: false, prix: 45000, duree: "12 semaines", emoji: "🇬🇧" },
  { slug: "diction",    title: "Diction & Prise de parole", desc: "Maîtriser l'expression orale et la présentation en public.",  gratuit: true,                duree: "6 semaines",  emoji: "🎤" },
  { slug: "bureautique",title: "Bureautique & Office",     desc: "Word, Excel, PowerPoint — niveau certifiant.",                gratuit: true,                duree: "4 semaines",  emoji: "💻" },
  { slug: "entrepreneuriat", title: "Entrepreneuriat",     desc: "Monter son projet : business model, financement, pitch.",     gratuit: false, prix: 60000, duree: "10 semaines", emoji: "🚀" },
  { slug: "allemand",   title: "Allemand débutant",        desc: "Bases de l'allemand pour étudier en Allemagne (DAAD).",       gratuit: false, prix: 40000, duree: "12 semaines", emoji: "🇩🇪" },
  { slug: "design",     title: "Design graphique",         desc: "Initiation Figma, Canva et identité visuelle.",               gratuit: true,                duree: "8 semaines",  emoji: "🎨" },
];

/* ════════════════════════════════════════════════════════════
   PARCOURS DÉTAILLÉS
════════════════════════════════════════════════════════════ */

const genieLogiciel: Parcours = {
  slug:       "genie-logiciel",
  title:      "Génie Logiciel",
  school:     "École d'Informatique",
  cycleType:  "Licence",
  level:      "L1 → L3",
  duration:   "3 ans · 6 semestres",
  totalEcts:  180,
  image:      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=80",
  tagline:    "Concevez les logiciels qui transforment l'Afrique.",
  description:"Formez-vous au développement d'applications robustes, du code à l'architecture. Un cursus aligné sur les besoins du marché camerounais et international, mêlant théorie solide et projets concrets.",
  diplome:    "Licence en Génie Logiciel (Bac+3, 180 ECTS) — reconnue CEMAC",
  basePriceFcfa: 480000,
  fraisDossier:  50000,
  annees: [
    {
      niveau: "L1", titre: "Première année — Fondamentaux",
      semestres: [
        { nom: "Semestre 1", ues: [
          { code: "INF101", title: "Algorithmique & Programmation",  ects: 6, type: ["video","plateforme","live"], devoirs: "TP notés + examen final" },
          { code: "MAT101", title: "Mathématiques discrètes",        ects: 5, type: ["pdf","plateforme"],          devoirs: "Devoirs surveillés" },
          { code: "INF102", title: "Architecture des ordinateurs",   ects: 4, type: ["video","pdf"],               devoirs: "Examen écrit" },
          { code: "LAN101", title: "Anglais technique",              ects: 3, type: ["live","plateforme"],         devoirs: "Oral + projet" },
        ]},
        { nom: "Semestre 2", ues: [
          { code: "INF103", title: "Programmation orientée objet",   ects: 6, type: ["video","plateforme","live"], devoirs: "Projet logiciel" },
          { code: "INF104", title: "Bases de données relationnelles",ects: 5, type: ["video","pdf","plateforme"],  devoirs: "TP + examen" },
          { code: "MAT102", title: "Algèbre linéaire",               ects: 4, type: ["pdf","live"],                devoirs: "Devoirs surveillés" },
          { code: "PRO101", title: "Projet tutoré I",                ects: 3, type: ["live"],                      devoirs: "Soutenance" },
        ]},
      ],
    },
    {
      niveau: "L2", titre: "Deuxième année — Spécialisation",
      semestres: [
        { nom: "Semestre 3", ues: [
          { code: "INF201", title: "Structures de données avancées", ects: 6, type: ["video","plateforme"],       devoirs: "TP notés" },
          { code: "INF202", title: "Développement web full-stack",   ects: 6, type: ["video","plateforme","live"], devoirs: "Projet web" },
          { code: "INF203", title: "Systèmes d'exploitation",        ects: 5, type: ["pdf","video"],               devoirs: "Examen + TP" },
        ]},
        { nom: "Semestre 4", ues: [
          { code: "INF204", title: "Génie logiciel & UML",           ects: 6, type: ["pdf","live","plateforme"],   devoirs: "Projet en équipe" },
          { code: "INF205", title: "Développement mobile",           ects: 5, type: ["video","plateforme","live"], devoirs: "Application mobile" },
          { code: "PRO201", title: "Stage / Projet tutoré II",       ects: 4, type: ["live"],                      devoirs: "Rapport + soutenance" },
        ]},
      ],
    },
    {
      niveau: "L3", titre: "Troisième année — Professionnalisation",
      semestres: [
        { nom: "Semestre 5", ues: [
          { code: "INF301", title: "Architecture logicielle",        ects: 6, type: ["pdf","live"],                devoirs: "Étude de cas" },
          { code: "INF302", title: "DevOps & CI/CD",                 ects: 5, type: ["video","plateforme","live"], devoirs: "Pipeline déployé" },
          { code: "INF303", title: "Sécurité applicative",           ects: 5, type: ["video","pdf"],               devoirs: "Audit de sécurité" },
        ]},
        { nom: "Semestre 6", ues: [
          { code: "PRO301", title: "Projet de fin d'études",         ects: 12, type: ["live"],                     devoirs: "Mémoire + soutenance jury" },
          { code: "INF304", title: "Intelligence artificielle",      ects: 6, type: ["video","plateforme"],        devoirs: "Projet ML" },
        ]},
      ],
    },
  ],
  opportunites: [
    { pays: "France",   flag: "🇫🇷", partenaire: "Université de Lille",        detail: "Poursuite en Master Informatique (accord Campus France)." },
    { pays: "Canada",   flag: "🇨🇦", partenaire: "Université de Sherbrooke",   detail: "Échange 1 semestre + stage coopératif rémunéré." },
    { pays: "Maroc",    flag: "🇲🇦", partenaire: "UM6P Benguerir",            detail: "Double diplôme en ingénierie logicielle." },
    { pays: "Allemagne",flag: "🇩🇪", partenaire: "Bourse DAAD",               detail: "Master en informatique, financement DAAD disponible." },
  ],
  debouches: [
    "Développeur full-stack / mobile",
    "Architecte logiciel",
    "Ingénieur DevOps",
    "Chef de projet technique",
    "Consultant en transformation digitale",
  ],
};

const gestionFinance: Parcours = {
  slug:       "gestion-finance",
  title:      "Gestion & Finance",
  school:     "École de Gestion",
  cycleType:  "Licence",
  level:      "L1 → L3",
  duration:   "3 ans · 6 semestres",
  totalEcts:  180,
  image:      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80",
  tagline:    "Pilotez la performance des entreprises africaines.",
  description:"Maîtrisez la comptabilité OHADA, l'analyse financière et le management. Une formation tournée vers les réalités économiques de la zone CEMAC et les standards internationaux.",
  diplome:    "Licence en Gestion & Finance (Bac+3, 180 ECTS) — conforme OHADA",
  basePriceFcfa: 420000,
  fraisDossier:  50000,
  annees: [
    {
      niveau: "L1", titre: "Première année — Bases de gestion",
      semestres: [
        { nom: "Semestre 1", ues: [
          { code: "GES101", title: "Comptabilité générale OHADA",    ects: 6, type: ["pdf","plateforme","live"],   devoirs: "Exercices + examen" },
          { code: "ECO101", title: "Microéconomie",                  ects: 5, type: ["video","pdf"],               devoirs: "Devoirs surveillés" },
          { code: "GES102", title: "Introduction au management",     ects: 4, type: ["video","plateforme"],        devoirs: "Étude de cas" },
          { code: "LAN101", title: "Anglais des affaires",           ects: 3, type: ["live","plateforme"],         devoirs: "Oral" },
        ]},
        { nom: "Semestre 2", ues: [
          { code: "GES103", title: "Comptabilité analytique",        ects: 6, type: ["pdf","plateforme","live"],   devoirs: "TP comptables" },
          { code: "ECO102", title: "Macroéconomie",                  ects: 5, type: ["video","pdf"],               devoirs: "Examen" },
          { code: "DRO101", title: "Droit des affaires",             ects: 4, type: ["pdf","live"],                devoirs: "Cas pratiques" },
          { code: "PRO101", title: "Projet tutoré I",                ects: 3, type: ["live"],                      devoirs: "Soutenance" },
        ]},
      ],
    },
    {
      niveau: "L2", titre: "Deuxième année — Finance & contrôle",
      semestres: [
        { nom: "Semestre 3", ues: [
          { code: "FIN201", title: "Analyse financière",            ects: 6, type: ["video","plateforme","live"], devoirs: "Diagnostic d'entreprise" },
          { code: "GES201", title: "Contrôle de gestion",           ects: 5, type: ["pdf","plateforme"],          devoirs: "Tableaux de bord" },
          { code: "MAR201", title: "Marketing fondamental",          ects: 5, type: ["video","live"],              devoirs: "Plan marketing" },
        ]},
        { nom: "Semestre 4", ues: [
          { code: "FIN202", title: "Mathématiques financières",     ects: 6, type: ["pdf","plateforme"],          devoirs: "Examen" },
          { code: "GES202", title: "Gestion des ressources humaines",ects: 5, type: ["video","live"],             devoirs: "Étude de cas" },
          { code: "PRO201", title: "Stage en entreprise",           ects: 4, type: ["live"],                      devoirs: "Rapport de stage" },
        ]},
      ],
    },
    {
      niveau: "L3", titre: "Troisième année — Expertise",
      semestres: [
        { nom: "Semestre 5", ues: [
          { code: "FIN301", title: "Finance d'entreprise",          ects: 6, type: ["pdf","live"],                devoirs: "Étude de cas" },
          { code: "FIN302", title: "Fiscalité camerounaise",        ects: 5, type: ["pdf","plateforme"],          devoirs: "Déclarations fiscales" },
          { code: "GES301", title: "Stratégie d'entreprise",        ects: 5, type: ["video","live"],              devoirs: "Business plan" },
        ]},
        { nom: "Semestre 6", ues: [
          { code: "PRO301", title: "Projet de fin d'études",        ects: 12, type: ["live"],                     devoirs: "Mémoire + soutenance jury" },
          { code: "FIN303", title: "Audit & contrôle",             ects: 6, type: ["pdf","plateforme"],          devoirs: "Mission d'audit" },
        ]},
      ],
    },
  ],
  opportunites: [
    { pays: "France",  flag: "🇫🇷", partenaire: "IAE Paris",            detail: "Master Comptabilité-Contrôle-Audit." },
    { pays: "Canada",  flag: "🇨🇦", partenaire: "HEC Montréal",         detail: "MBA, admission sur dossier." },
    { pays: "Sénégal", flag: "🇸🇳", partenaire: "BEM Dakar",            detail: "Échange académique 1 an." },
    { pays: "Tunisie", flag: "🇹🇳", partenaire: "IHEC Carthage",        detail: "Double diplôme en finance." },
  ],
  debouches: [
    "Analyste financier",
    "Contrôleur de gestion",
    "Comptable / Expert-comptable",
    "Auditeur",
    "Responsable administratif et financier",
  ],
};

const sciencesBio: Parcours = {
  slug:       "sciences-biologiques",
  title:      "Sciences Biologiques",
  school:     "École des Sciences",
  cycleType:  "Licence",
  level:      "L1 → L3",
  duration:   "3 ans · 6 semestres",
  totalEcts:  180,
  image:      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=900&q=80",
  tagline:    "Explorez le vivant, de la cellule à l'écosystème.",
  description:"Une formation scientifique rigoureuse en biologie, biochimie et environnement, articulée autour de travaux pratiques en laboratoire et de projets de recherche appliqués au contexte africain.",
  diplome:    "Licence en Sciences Biologiques (Bac+3, 180 ECTS)",
  basePriceFcfa: 450000,
  fraisDossier:  50000,
  annees: [
    {
      niveau: "L1", titre: "Première année — Tronc commun sciences",
      semestres: [
        { nom: "Semestre 1", ues: [
          { code: "BIO101", title: "Biologie cellulaire",           ects: 6, type: ["video","pdf","live"],        devoirs: "TP labo + examen" },
          { code: "CHI101", title: "Chimie générale",               ects: 5, type: ["pdf","plateforme"],          devoirs: "TP + examen" },
          { code: "MAT101", title: "Mathématiques pour les sciences",ects: 4, type: ["pdf","plateforme"],         devoirs: "Devoirs surveillés" },
          { code: "LAN101", title: "Anglais scientifique",          ects: 3, type: ["live","plateforme"],         devoirs: "Oral" },
        ]},
        { nom: "Semestre 2", ues: [
          { code: "BIO102", title: "Biochimie structurale",         ects: 6, type: ["video","pdf"],               devoirs: "TP labo" },
          { code: "BIO103", title: "Génétique",                     ects: 5, type: ["video","plateforme","live"], devoirs: "Examen" },
          { code: "PHY101", title: "Physique",                      ects: 4, type: ["pdf","video"],               devoirs: "TP + examen" },
          { code: "PRO101", title: "Projet tutoré I",               ects: 3, type: ["live"],                      devoirs: "Soutenance" },
        ]},
      ],
    },
    {
      niveau: "L2", titre: "Deuxième année — Approfondissement",
      semestres: [
        { nom: "Semestre 3", ues: [
          { code: "BIO201", title: "Microbiologie",                 ects: 6, type: ["video","pdf","live"],        devoirs: "TP labo" },
          { code: "BIO202", title: "Physiologie animale",           ects: 5, type: ["video","plateforme"],        devoirs: "Examen" },
          { code: "BIO203", title: "Écologie",                      ects: 5, type: ["pdf","live"],                devoirs: "Étude terrain" },
        ]},
        { nom: "Semestre 4", ues: [
          { code: "BIO204", title: "Biologie moléculaire",          ects: 6, type: ["video","plateforme","live"], devoirs: "TP labo" },
          { code: "BIO205", title: "Botanique appliquée",           ects: 5, type: ["pdf","video"],               devoirs: "Herbier + examen" },
          { code: "PRO201", title: "Stage en laboratoire",          ects: 4, type: ["live"],                      devoirs: "Rapport" },
        ]},
      ],
    },
    {
      niveau: "L3", titre: "Troisième année — Spécialisation recherche",
      semestres: [
        { nom: "Semestre 5", ues: [
          { code: "BIO301", title: "Immunologie",                   ects: 6, type: ["video","pdf"],               devoirs: "Examen" },
          { code: "BIO302", title: "Biotechnologies",               ects: 5, type: ["video","plateforme","live"], devoirs: "Projet labo" },
          { code: "BIO303", title: "Santé publique & épidémiologie",ects: 5, type: ["pdf","live"],                devoirs: "Étude de cas" },
        ]},
        { nom: "Semestre 6", ues: [
          { code: "PRO301", title: "Projet de fin d'études",        ects: 12, type: ["live"],                     devoirs: "Mémoire + soutenance jury" },
          { code: "BIO304", title: "Bio-informatique",              ects: 6, type: ["video","plateforme"],        devoirs: "Projet" },
        ]},
      ],
    },
  ],
  opportunites: [
    { pays: "France",   flag: "🇫🇷", partenaire: "Université de Montpellier", detail: "Master Biologie-Santé." },
    { pays: "Belgique", flag: "🇧🇪", partenaire: "UCLouvain",               detail: "Master en biotechnologies." },
    { pays: "Maroc",    flag: "🇲🇦", partenaire: "Université Mohammed V",    detail: "Échange recherche." },
    { pays: "Afrique du Sud", flag: "🇿🇦", partenaire: "University of Cape Town", detail: "Programme de recherche en santé publique." },
  ],
  debouches: [
    "Technicien de laboratoire",
    "Assistant de recherche",
    "Chargé d'études environnementales",
    "Biotechnologue",
    "Enseignant en sciences",
  ],
};

/* ── Catalogue : 3 parcours détaillés + génération des autres ── */
const DETAILED: Parcours[] = [genieLogiciel, gestionFinance, sciencesBio];

/* Métadonnées légères pour les filières restantes (lien depuis l'accueil) */
const STUBS: { slug: string; title: string; school: string; image: string; base: number }[] = [
  { slug: "informatique",            title: "Informatique",              school: "École d'Informatique", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80", base: 480000 },
  { slug: "reseaux-telecom",         title: "Réseaux & Télécom",          school: "École d'Informatique", image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=900&q=80", base: 470000 },
  { slug: "bases-de-donnees",        title: "Bases de Données",           school: "École d'Informatique", image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=900&q=80", base: 460000 },
  { slug: "intelligence-artificielle",title: "Intelligence Artificielle", school: "École d'Informatique", image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&q=80", base: 520000 },
  { slug: "management",              title: "Management",                 school: "École de Gestion",     image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&q=80", base: 420000 },
  { slug: "relations-internationales",title: "Relations Internationales", school: "École de Gestion",     image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=900&q=80", base: 430000 },
  { slug: "mathematiques",           title: "Mathématiques",              school: "École des Sciences",   image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&q=80", base: 440000 },
  { slug: "chimie-sciences",         title: "Chimie & Sciences",          school: "École des Sciences",   image: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=900&q=80", base: 450000 },
  { slug: "lettres-shs",             title: "Lettres & SHS",              school: "École des Sciences",   image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=900&q=80", base: 400000 },
];

/** Génère un parcours complet à partir d'un stub (réutilise une trame générique) */
function buildFromStub(s: typeof STUBS[0]): Parcours {
  return {
    slug: s.slug, title: s.title, school: s.school,
    cycleType: "Licence", level: "L1 → L3", duration: "3 ans · 6 semestres",
    totalEcts: 180, image: s.image,
    tagline: `Construisez votre expertise en ${s.title.toLowerCase()} à JFN.`,
    description: `Le parcours ${s.title} forme des professionnels qualifiés et opérationnels, alliant solides bases théoriques et projets appliqués au contexte camerounais et international.`,
    diplome: `Licence en ${s.title} (Bac+3, 180 ECTS)`,
    basePriceFcfa: s.base, fraisDossier: 50000,
    annees: genieLogiciel.annees.map((a) => ({ ...a })),
    opportunites: [
      { pays: "France", flag: "🇫🇷", partenaire: "Universités partenaires", detail: "Poursuite en Master via Campus France." },
      { pays: "Canada", flag: "🇨🇦", partenaire: "Réseau universitaire",     detail: "Échange et stage coopératif." },
      { pays: "Maroc",  flag: "🇲🇦", partenaire: "Universités du Maghreb",   detail: "Double diplôme possible." },
    ],
    debouches: ["Cadre spécialisé", "Consultant", "Chef de projet", "Chercheur / enseignant"],
  };
}

export const PARCOURS: Parcours[] = [
  ...DETAILED,
  ...STUBS.map(buildFromStub),
];

export function getParcours(slug: string): Parcours | undefined {
  return PARCOURS.find((p) => p.slug === slug);
}

export function priceForCycle(p: Parcours, cycle: CycleId): number {
  const c = CYCLES.find((x) => x.id === cycle)!;
  return Math.round((p.basePriceFcfa * c.factor) / 1000) * 1000;
}

export function formatFcfa(n: number): string {
  return n.toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
}
