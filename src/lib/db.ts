/* ════════════════════════════════════════════════════════════
   CAMA — Base de données localStorage (prototype v2)
   Simule PostgreSQL+Prisma pour tester toutes les features :
   5 modes d'enseignement, lives, examens, résultats, jury.
════════════════════════════════════════════════════════════ */

/* ── Types ── */

export interface DBUE {
  id: string; code: string; title: string; ects: number;
  semestre: string; teacherId: string;
}

export type BlocNatif =
  | { type: "titre"; text: string }
  | { type: "texte"; text: string }
  | { type: "point"; text: string }                       // point-clé
  | { type: "definition"; terme: string; text: string }   // repliable
  | { type: "quiz"; question: string; options: string[]; bonne: number };

export interface DBChapter {
  id: string; courseId: string; order: number; title: string;
  pdf?:   { name: string; sizeMo: number; pages: number };
  video?: { title: string; durationMin: number; transcript: string; sizeMo: number };
  natif?: { blocks: BlocNatif[] };
  liveId?: string;
}

export interface DBCourse {
  id: string; ueId: string; title: string; teacherId: string;
  published: boolean; profIA: boolean; description: string;
}

export interface DBChatMsg {
  id: string; liveId: string; author: string; role: string;
  text: string; time: string;
}

export interface DBLive {
  id: string; courseId: string; title: string;
  date: string;                       // ISO
  durationMin: number;
  status: "planifie" | "encours" | "termine";
  replayPublie: boolean;
  participants: string[];
}

export interface DBQuestion {
  id: string;
  type: "qcm" | "ouverte";
  text: string;
  options?: string[];
  bonne?: number;       // index QCM
  points: number;
}

export interface DBExam {
  id: string; ueId: string; title: string;
  date: string; durationMin: number;
  status: "planifie" | "ouvert" | "termine";
  questions: DBQuestion[];
}

export interface DBAlert {
  time: string;
  type: "onglet" | "copier" | "coller" | "plein-ecran" | "saisie";
  detail: string;
}

export interface DBAttempt {
  id: string; examId: string; studentId: string;
  answers: Record<string, string | number>;
  status: "encours" | "soumis" | "corrige";
  startedAt: string;
  score?: number;       // /20
  scoreMax?: number;
  alerts: DBAlert[];
  feedback?: string;
}

export interface DBResult {
  id: string; studentId: string; ueId: string;
  note: number; credits: number;
  validatedByJury: boolean;
}

export interface DBProgress {
  studentId: string; chapterId: string; doneAt: string;
}

export interface DBForumMsg {
  id: string; ueId: string; author: string; role: string;
  text: string; time: string;
}

export interface DBNotif {
  id: string; userId: string; text: string; time: string; read: boolean;
}

interface DB {
  ues:       DBUE[];
  courses:   DBCourse[];
  chapters:  DBChapter[];
  lives:     DBLive[];
  chat:      DBChatMsg[];
  exams:     DBExam[];
  attempts:  DBAttempt[];
  results:   DBResult[];
  progress:  DBProgress[];
  forum:     DBForumMsg[];
  notifs:    DBNotif[];
}

/* ── Seed ── */

const SEED: DB = {
  ues: [
    { id: "ue1", code: "INF201", title: "Structures de données avancées", ects: 6, semestre: "S3", teacherId: "u2" },
    { id: "ue2", code: "INF202", title: "Développement web full-stack",   ects: 6, semestre: "S3", teacherId: "u2" },
    { id: "ue3", code: "MAT201", title: "Analyse mathématique II",        ects: 5, semestre: "S3", teacherId: "u2" },
  ],
  courses: [
    { id: "c1", ueId: "ue1", title: "Structures de données avancées", teacherId: "u2", published: true,  profIA: true,
      description: "Arbres, graphes, tables de hachage et analyse de complexité — le socle de tout informaticien." },
    { id: "c2", ueId: "ue2", title: "Développement web full-stack",   teacherId: "u2", published: true,  profIA: true,
      description: "Du HTML aux API REST : construire une application web complète, optimisée bas-débit." },
    { id: "c3", ueId: "ue3", title: "Analyse mathématique II",        teacherId: "u2", published: false, profIA: false,
      description: "Séries numériques, intégrales multiples et équations différentielles." },
  ],
  chapters: [
    {
      id: "ch1", courseId: "c1", order: 1, title: "Introduction & complexité algorithmique",
      pdf:   { name: "INF201-ch1-complexite.pdf", sizeMo: 1.2, pages: 18 },
      video: { title: "Comprendre la notation Big-O", durationMin: 24, sizeMo: 85,
        transcript: "Bienvenue dans ce premier chapitre. La complexité algorithmique mesure l'efficacité d'un algorithme en fonction de la taille de l'entrée. La notation Big-O exprime la borne supérieure asymptotique : O(1) constant, O(log n) logarithmique, O(n) linéaire, O(n²) quadratique. Un tri à bulles est en O(n²) tandis qu'un tri fusion est en O(n log n)..." },
      natif: { blocks: [
        { type: "titre", text: "La complexité algorithmique" },
        { type: "texte", text: "Un algorithme est efficace s'il consomme peu de temps et de mémoire. La complexité mesure cette consommation en fonction de la taille n de l'entrée, indépendamment de la machine." },
        { type: "point", text: "La notation Big-O décrit le pire cas : O(n²) signifie que le temps croît au carré de la taille." },
        { type: "definition", terme: "Complexité temporelle", text: "Nombre d'opérations élémentaires effectuées par l'algorithme en fonction de n." },
        { type: "texte", text: "Comparons : pour n = 1000, un algorithme O(n) fait ~1000 opérations, un O(n²) en fait ~1 000 000. Le choix de l'algorithme compte plus que la puissance de la machine." },
        { type: "quiz", question: "Quelle est la complexité du tri fusion ?", options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], bonne: 1 },
      ]},
    },
    {
      id: "ch2", courseId: "c1", order: 2, title: "Arbres binaires de recherche",
      pdf:   { name: "INF201-ch2-arbres.pdf", sizeMo: 1.8, pages: 26 },
      video: { title: "Les arbres binaires en pratique", durationMin: 31, sizeMo: 110,
        transcript: "Un arbre binaire de recherche est une structure où chaque nœud a au plus deux enfants : le sous-arbre gauche contient les valeurs inférieures, le droit les valeurs supérieures. La recherche, l'insertion et la suppression s'effectuent en O(log n) si l'arbre est équilibré..." },
      natif: { blocks: [
        { type: "titre", text: "Arbres binaires de recherche (ABR)" },
        { type: "texte", text: "L'ABR organise les données pour une recherche dichotomique permanente : à chaque nœud, on élimine la moitié de l'espace de recherche." },
        { type: "point", text: "Recherche, insertion, suppression : O(log n) si équilibré, O(n) dans le pire cas (arbre dégénéré)." },
        { type: "definition", terme: "Rotation", text: "Opération de rééquilibrage qui réorganise localement les nœuds sans casser l'ordre (utilisée par les arbres AVL)." },
        { type: "quiz", question: "Dans un ABR, où se trouvent les valeurs inférieures au nœud ?", options: ["À droite", "À gauche", "Au-dessus", "Peu importe"], bonne: 1 },
      ]},
      liveId: "l1",
    },
    {
      id: "ch3", courseId: "c1", order: 3, title: "Tables de hachage",
      pdf: { name: "INF201-ch3-hachage.pdf", sizeMo: 1.5, pages: 22 },
      natif: { blocks: [
        { type: "titre", text: "Les tables de hachage" },
        { type: "texte", text: "Une table de hachage associe des clés à des valeurs via une fonction de hachage, offrant un accès en O(1) en moyenne." },
        { type: "point", text: "La gestion des collisions (chaînage, adressage ouvert) est le cœur du sujet." },
        { type: "quiz", question: "Quel est l'accès moyen dans une table de hachage ?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], bonne: 0 },
      ]},
    },
    {
      id: "ch4", courseId: "c2", order: 1, title: "HTML, CSS et le web moderne",
      pdf:   { name: "INF202-ch1-html.pdf", sizeMo: 0.9, pages: 14 },
      video: { title: "Construire sa première page", durationMin: 19, sizeMo: 65,
        transcript: "Le HTML structure le contenu, le CSS le met en forme. Une page bien construite est sémantique : header, nav, main, footer. Le responsive design adapte la mise en page à tous les écrans grâce aux media queries..." },
      natif: { blocks: [
        { type: "titre", text: "Le trio HTML / CSS / JS" },
        { type: "texte", text: "HTML structure, CSS présente, JavaScript anime. Cette séparation des responsabilités est le fondement du web." },
        { type: "quiz", question: "Quel langage gère la mise en forme ?", options: ["HTML", "CSS", "JavaScript", "PHP"], bonne: 1 },
      ]},
    },
    {
      id: "ch5", courseId: "c2", order: 2, title: "JavaScript & interactivité",
      natif: { blocks: [
        { type: "titre", text: "JavaScript côté navigateur" },
        { type: "texte", text: "Le DOM est l'arbre des éléments de la page. JavaScript le manipule pour créer l'interactivité : événements, modifications dynamiques, requêtes réseau." },
        { type: "point", text: "fetch() permet d'appeler une API sans recharger la page (AJAX)." },
        { type: "quiz", question: "Que représente le DOM ?", options: ["Une base de données", "L'arbre des éléments de la page", "Un serveur", "Un framework"], bonne: 1 },
      ]},
      liveId: "l2",
    },
  ],
  lives: [
    { id: "l1", courseId: "c1", title: "TD en direct — Arbres binaires", date: new Date(Date.now() + 30 * 60000).toISOString(),
      durationMin: 60, status: "encours", replayPublie: false, participants: ["u1"] },
    { id: "l2", courseId: "c2", title: "Live coding — API REST", date: new Date(Date.now() + 86400000 * 2).toISOString(),
      durationMin: 90, status: "planifie", replayPublie: false, participants: [] },
  ],
  chat: [
    { id: "m1", liveId: "l1", author: "Prof. Amina Bello", role: "enseignant", text: "Bonjour à tous, on commence dans quelques minutes. Préparez vos questions sur les ABR !", time: "18:00" },
    { id: "m2", liveId: "l1", author: "Nadia Mbeki", role: "etudiant", text: "Bonsoir Prof ! Prêt 👍", time: "18:01" },
  ],
  exams: [
    {
      id: "e1", ueId: "ue1", title: "Examen partiel — Structures de données",
      date: new Date().toISOString(), durationMin: 45, status: "ouvert",
      questions: [
        { id: "q1", type: "qcm", text: "Quelle est la complexité de recherche dans un ABR équilibré ?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], bonne: 1, points: 4 },
        { id: "q2", type: "qcm", text: "Quelle structure garantit un accès moyen en O(1) ?", options: ["Liste chaînée", "Arbre AVL", "Table de hachage", "Pile"], bonne: 2, points: 4 },
        { id: "q3", type: "qcm", text: "Le tri fusion est de complexité :", options: ["O(n)", "O(n²)", "O(n log n)", "O(log n)"], bonne: 2, points: 4 },
        { id: "q4", type: "ouverte", text: "Expliquez, dans le contexte d'une application mobile camerounaise à faible connectivité, pourquoi le choix d'une structure de données adaptée est critique. Donnez un exemple concret.", points: 8 },
      ],
    },
    {
      id: "e2", ueId: "ue2", title: "Quiz — Bases du web",
      date: new Date(Date.now() + 86400000 * 5).toISOString(), durationMin: 30, status: "planifie",
      questions: [
        { id: "q1", type: "qcm", text: "Quel élément HTML est sémantiquement correct pour la navigation ?", options: ["<div>", "<nav>", "<span>", "<table>"], bonne: 1, points: 5 },
        { id: "q2", type: "ouverte", text: "Décrivez le rôle des media queries dans une approche mobile-first.", points: 5 },
      ],
    },
  ],
  attempts: [
    { id: "a0", examId: "e1", studentId: "u9", answers: { q1: 1, q2: 2, q3: 0, q4: "Dans une application mobile, une structure adaptée réduit les calculs..." },
      status: "soumis", startedAt: new Date(Date.now() - 3600000).toISOString(), alerts: [
        { time: "14:12", type: "onglet", detail: "Changement d'onglet détecté (8s)" },
      ]},
  ],
  results: [
    { id: "r1", studentId: "u1", ueId: "ue3", note: 14.5, credits: 5, validatedByJury: true },
  ],
  progress: [
    { studentId: "u1", chapterId: "ch1", doneAt: new Date(Date.now() - 86400000).toISOString() },
  ],
  forum: [
    { id: "f1", ueId: "ue1", author: "Nadia Mbeki", role: "etudiant", text: "Quelqu'un peut m'expliquer la différence entre AVL et arbre rouge-noir ?", time: "Hier · 16:40" },
    { id: "f2", ueId: "ue1", author: "Prof. Amina Bello", role: "enseignant", text: "Bonne question Nadia — les deux sont équilibrés, mais l'AVL est plus strict (rééquilibrage plus fréquent, recherche plus rapide). On en parle au live de demain.", time: "Hier · 18:02" },
  ],
  notifs: [
    { id: "n1", userId: "u1", text: "Live « TD Arbres binaires » démarre bientôt", time: "Il y a 10 min", read: false },
    { id: "n2", userId: "u1", text: "Examen INF201 ouvert — 45 min", time: "Il y a 1h", read: false },
  ],
};

/* ── Accès ── */

const KEY = "cama_db_v2";

export function loadDB(): DB {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch { /* ignore */ }
  localStorage.setItem(KEY, JSON.stringify(SEED));
  return JSON.parse(JSON.stringify(SEED));
}

export function saveDB(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("cama-db"));
}

export function resetDB() {
  localStorage.removeItem(KEY);
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/* Helpers métier */
export function gradeQcm(exam: DBExam, answers: Record<string, string | number>) {
  let pts = 0, maxAuto = 0, maxTotal = 0;
  for (const q of exam.questions) {
    maxTotal += q.points;
    if (q.type === "qcm") {
      maxAuto += q.points;
      if (answers[q.id] === q.bonne) pts += q.points;
    }
  }
  return { pts, maxAuto, maxTotal };
}
