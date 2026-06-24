import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Spécification OpenAPI 3.0 COMPLÈTE de l'API CAMA.
 * Couvre TOUTES les routes Next.js (/api/*), TOUTES les tables Supabase
 * (PostgREST), et TOUS les schémas de données.
 * Servie en JSON et consommée par Swagger UI (/api-docs).
 */

/* ── Helpers pour ne pas répéter les propriétés uuid/timestamp ── */
const uuid = { type: "string" as const, format: "uuid" as const };
const ts   = { type: "string" as const, format: "date-time" as const };
const nullable = (s: object) => ({ ...s, nullable: true });

const spec = {
  openapi: "3.0.3",
  info: {
    title: "CAMA — API complète",
    version: "1.0.0",
    description:
      "Documentation exhaustive de la plateforme **CAMA** — LMS de l'Institut JFN (Yaoundé, Cameroun).\n\n" +
      "L'API est composée de 2 familles :\n\n" +
      "1. **Routes Next.js** (`/api/*`) — endpoints serveur pour la visioconférence, la recherche web et l'exécution de code.\n" +
      "2. **Données Supabase (PostgREST)** — CRUD automatique sur chaque table via le SDK JS ou les requêtes REST " +
      "(`https://<projet>.supabase.co/rest/v1/<table>`). Requiert les headers `apikey` et `Authorization: Bearer <jwt>`.\n\n" +
      "### Authentification\n" +
      "- **Supabase Auth** gère les sessions (email + mot de passe).\n" +
      "- Le JWT de session est passé en header `Authorization: Bearer <token>` sur chaque appel PostgREST.\n" +
      "- La clé publique anon est passée en header `apikey`.\n\n" +
      "### Rôles\n" +
      "`etudiant` · `enseignant` · `admin` · `jury`\n\n" +
      "### Variables d'environnement requises\n" +
      "| Variable | Usage |\n" +
      "|----------|-------|\n" +
      "| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |\n" +
      "| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon |\n" +
      "| `JAAS_APP_ID` / `JAAS_KEY_ID` / `JAAS_PRIVATE_KEY` | Jitsi JaaS (visio) |\n" +
      "| `TAVILY_API_KEY` / `SERPER_API_KEY` / `BRAVE_API_KEY` | Recherche web (optionnel) |\n",
    contact: { name: "Institut JFN", url: "https://jfn-univ.com" },
    license: { name: "Propriétaire" },
  },
  externalDocs: {
    description: "Documentation Supabase PostgREST",
    url: "https://supabase.com/docs/guides/api",
  },
  servers: [
    { url: "/", description: "Serveur courant (Next.js)" },
  ],
  tags: [
    { name: "Auth", description: "Authentification et sessions (Supabase Auth)." },
    { name: "Utilisateurs", description: "Gestion des profils utilisateurs." },
    { name: "Inscriptions", description: "Dossiers académiques des étudiants." },
    { name: "Programme", description: "Cours du programme académique (par filière)." },
    { name: "Chapitres", description: "Contenus de cours (PDF, vidéo, natif)." },
    { name: "Progression", description: "Suivi de progression étudiant chapitre par chapitre." },
    { name: "Sessions", description: "Emploi du temps (créneaux campus, live, async, examen)." },
    { name: "Ressources", description: "Fichiers et supports de cours (syllabus, PDF, liens)." },
    { name: "Upload", description: "Téléversement de fichiers dans Supabase Storage." },
    { name: "Examens", description: "Création, passation, auto-correction et suivi anti-triche." },
    { name: "Questions", description: "Banque de questions d'examen (QCM ou ouvertes)." },
    { name: "Tentatives", description: "Soumissions d'examen par les étudiants." },
    { name: "Délibérations", description: "Notes, crédits ECTS et validation par le jury." },
    { name: "Lives", description: "Classes virtuelles (Jitsi Meet / JaaS)." },
    { name: "Visioconférence", description: "Génération de jetons JWT pour les salles Jitsi." },
    { name: "TP & Machines", description: "Machines distantes (ttyd/VNC/Guacamole) et exécution de code sandbox." },
    { name: "Code Sandbox", description: "Exécution de code via Piston API (60+ langages)." },
    { name: "Calendrier", description: "Événements académiques (examens, jurys, vacances…)." },
    { name: "Présences", description: "Suivi de présence par séance (enseignant → étudiant)." },
    { name: "Cours hors-cursus", description: "Activités parascolaires (Soft skills, Langues, Tech…)." },
    { name: "Inscriptions hors-cursus", description: "Inscriptions et progression des étudiants aux cours hors-cursus." },
    { name: "Certifications", description: "Catalogue de certifications professionnelles (AWS, Cisco, Google…)." },
    { name: "Inscriptions certif.", description: "Inscriptions et progression des étudiants aux certifications." },
    { name: "Journal", description: "Articles du Journal JFN (fil d'actualités multi-média)." },
    { name: "Réactions Journal", description: "Interactions like / save sur les articles." },
    { name: "Recherche", description: "CAMA Search — recherche web multi-provider." },
    { name: "Documentation", description: "Spécification OpenAPI et interface Swagger." },
  ],

  /* ════════════════════════════════════════════════════════════════
   *  PATHS
   * ════════════════════════════════════════════════════════════════ */
  paths: {
    /* ── Auth ── */
    "/auth/v1/signup": {
      post: { tags: ["Auth"], summary: "Créer un compte", description: "Inscription via Supabase Auth (email + mot de passe). Crée une entrée dans `auth.users` et dans `public.users`.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email", example: "amine@jfn.cm" }, password: { type: "string", example: "p@ssw0rd!" }, data: { type: "object", description: "Métadonnées (first_name, last_name, role…)" } } } } } },
        responses: { "200": { description: "Compte créé + JWT retourné" }, "400": { description: "Email invalide ou déjà existant" } }, security: [{ supabaseKey: [] }] },
    },
    "/auth/v1/token?grant_type=password": {
      post: { tags: ["Auth"], summary: "Connexion (email + mot de passe)", description: "Retourne un JWT de session et un refresh_token.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } } } } },
        responses: { "200": { description: "Session JWT" }, "400": { description: "Identifiants invalides" } }, security: [{ supabaseKey: [] }] },
    },
    "/auth/v1/logout": {
      post: { tags: ["Auth"], summary: "Déconnexion", description: "Invalide le JWT de session.", responses: { "204": { description: "Déconnexion réussie" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },
    "/auth/v1/user": {
      get: { tags: ["Auth"], summary: "Profil de l'utilisateur connecté", description: "Retourne les métadonnées de l'utilisateur authentifié.", responses: { "200": { description: "Profil auth" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── Jitsi Token ── */
    "/api/jitsi-token": {
      post: { tags: ["Visioconférence"], summary: "Génère un JWT JaaS pour une salle Jitsi",
        description: "Signe un jeton RS256 (3h de validité) permettant de rejoindre ou modérer une classe virtuelle. " +
          "Nécessite `JAAS_APP_ID`, `JAAS_KEY_ID` et `JAAS_PRIVATE_KEY` côté serveur.\n\n" +
          "**Rôle modérateur** : les enseignants envoient `moderator: true` pour obtenir les droits de modération (kick, mute, enregistrement).",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["room", "name", "id"],
          properties: { room: { type: "string", example: "CAMA-INF201-live", description: "Identifiant de la salle" }, name: { type: "string", example: "Amina Bello", description: "Nom affiché dans la salle" }, email: { type: "string", format: "email", example: "amina@jfn.cm" }, id: { type: "string", example: "user-uuid", description: "UUID de l'utilisateur" }, moderator: { type: "boolean", default: false, description: "true = rôle hôte/modérateur" } } } } } },
        responses: { "200": { description: "Jeton signé", content: { "application/json": { schema: { type: "object", properties: { jwt: { type: "string", description: "JWT RS256 signé" }, appId: { type: "string", description: "JaaS App ID" } } } } } },
          "500": { description: "JaaS non configuré", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } } },
      },
    },

    /* ── Recherche web ── */
    "/api/search": {
      get: { tags: ["Recherche"], summary: "Recherche web multi-provider",
        description: "Choisit automatiquement le provider disponible :\n\n" +
          "1. `TAVILY_API_KEY` → Tavily (1 000 req/mois, gratuit sans CB)\n" +
          "2. `SERPER_API_KEY` → Serper (2 500 req, gratuit sans CB)\n" +
          "3. `BRAVE_API_KEY` → Brave (2 000 req/mois, CB requise)\n" +
          "4. *(aucune clé)* → **Wikipédia FR** (gratuit, illimité)\n\n" +
          "En cas d'erreur d'un provider payant, retombe automatiquement sur Wikipédia.",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Termes de recherche", example: "complexité algorithmique" },
          { name: "count", in: "query", required: false, schema: { type: "integer", default: 8, maximum: 20 }, description: "Nombre de résultats souhaités" },
        ],
        responses: { "200": { description: "Résultats", content: { "application/json": { schema: { type: "object",
          properties: { query: { type: "string" }, provider: { type: "string", enum: ["wikipedia", "tavily", "serper", "brave"] }, results: { type: "array", items: { $ref: "#/components/schemas/WebResult" } }, error: nullable({ type: "string" }), fallback: { type: "boolean", description: "true si retombé sur Wikipédia après erreur provider" } } } } } } },
      },
    },

    /* ── OpenAPI ── */
    "/api/openapi": { get: { tags: ["Documentation"], summary: "Spécification OpenAPI 3.0 (JSON)", description: "Ce document. Utilisé par Swagger UI sur `/api-docs`.", responses: { "200": { description: "Document OpenAPI", content: { "application/json": {} } } } } },

    /* ════════════════════════════════════════════════════
     *  Données Supabase (PostgREST) — toutes les tables
     * ════════════════════════════════════════════════════ */

    /* ── users ── */
    "/rest/v1/users": {
      get: { tags: ["Utilisateurs"], summary: "Lister les utilisateurs", description: "Tous les profils. Filtrables par rôle (`?role=eq.enseignant`), école, etc.", parameters: [{ name: "role", in: "query", schema: { type: "string" }, example: "eq.enseignant" }, { name: "select", in: "query", schema: { type: "string" }, example: "id,email,first_name,last_name,role" }],
        responses: { "200": { description: "Liste", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Utilisateurs"], summary: "Modifier un utilisateur", description: "Met à jour le rôle, l'avatar, le téléphone, etc. Filtre via `?id=eq.<uuid>`.", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" }, example: "eq.uuid-here" }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/UserPatch" } } } }, responses: { "204": { description: "Modifié" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── inscriptions ── */
    "/rest/v1/inscriptions": {
      get: { tags: ["Inscriptions"], summary: "Lister les inscriptions (dossiers académiques)", description: "Un dossier par étudiant par année. Contient matricule, filière, cycle, mode, campus, crédits ECTS.", parameters: [{ name: "user_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" }, example: "eq.validee" }],
        responses: { "200": { description: "Inscriptions", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Inscription" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Inscriptions"], summary: "Créer une inscription", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Inscription" } } } }, responses: { "201": { description: "Créée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Inscriptions"], summary: "Modifier une inscription (statut…)", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["en_attente", "validee", "rejetee"] } } } } } }, responses: { "204": { description: "Modifiée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── program_courses ── */
    "/rest/v1/program_courses": {
      get: { tags: ["Programme"], summary: "Lister les matières du programme", description: "Matières filtrables par filière (`parcours_slug`), année (`annee_niveau`), semestre, enseignant (`teacher_id`), publication.",
        parameters: [{ name: "parcours_slug", in: "query", schema: { type: "string" }, example: "eq.genie-logiciel" }, { name: "annee_niveau", in: "query", schema: { type: "string" }, example: "eq.L1" }, { name: "published", in: "query", schema: { type: "string" }, example: "eq.true" }, { name: "teacher_id", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Cours", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ProgramCourse" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Programme"], summary: "Créer une matière (admin)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ProgramCourse" } } } }, responses: { "201": { description: "Créée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Programme"], summary: "Modifier une matière (enseignant, publication, contenu)", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ProgramCoursePatch" } } } }, responses: { "204": { description: "Modifiée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── course_chapters ── */
    "/rest/v1/course_chapters": {
      get: { tags: ["Chapitres"], summary: "Lister les chapitres d'un cours", parameters: [{ name: "program_course_id", in: "query", required: true, schema: { type: "string" }, example: "eq.uuid" }, { name: "order", in: "query", schema: { type: "string" }, example: "ordre.asc" }],
        responses: { "200": { description: "Chapitres ordonnés", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Chapter" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Chapitres"], summary: "Ajouter un chapitre (enseignant)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ChapterCreate" } } } }, responses: { "201": { description: "Créé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Chapitres"], summary: "Modifier un chapitre (PDF, vidéo, natif)", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ChapterPatch" } } } }, responses: { "204": { description: "Modifié" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Chapitres"], summary: "Supprimer un chapitre", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── chapter_progress ── */
    "/rest/v1/chapter_progress": {
      get: { tags: ["Progression"], summary: "Progression d'un étudiant", description: "Liste les chapitres complétés par un étudiant. `done_at` = date de validation.", parameters: [{ name: "student_id", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Chapitres complétés", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ChapterProgress" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Progression"], summary: "Marquer un chapitre comme complété", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ChapterProgress" } } } }, responses: { "201": { description: "Marqué" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Progression"], summary: "Annuler la complétion d'un chapitre", parameters: [{ name: "student_id", in: "query", required: true, schema: { type: "string" } }, { name: "chapter_id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Annulé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── course_sessions ── */
    "/rest/v1/course_sessions": {
      get: { tags: ["Sessions"], summary: "Emploi du temps (sessions de cours)", description: "Créneaux de cours filtrables par matière, jour, type, statut de validation.", parameters: [{ name: "program_course_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" }, example: "eq.valide" }, { name: "kind", in: "query", schema: { type: "string" }, example: "eq.campus" }],
        responses: { "200": { description: "Sessions", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Session" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Sessions"], summary: "Proposer une session (enseignant)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Session" } } } }, responses: { "201": { description: "Proposée (statut = propose)" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Sessions"], summary: "Valider / rejeter / modifier une session", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["propose", "valide", "rejete"] } } } } } }, responses: { "204": { description: "Modifiée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Sessions"], summary: "Supprimer une session", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── course_resources ── */
    "/rest/v1/course_resources": {
      get: { tags: ["Ressources"], summary: "Ressources d'un cours (syllabus, supports, liens)", parameters: [{ name: "program_course_id", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Ressources", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/CourseResource" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Ressources"], summary: "Ajouter une ressource", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CourseResource" } } } }, responses: { "201": { description: "Ajoutée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Ressources"], summary: "Supprimer une ressource", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── Upload (Supabase Storage) ── */
    "/storage/v1/object/course-media/{path}": {
      post: { tags: ["Upload"], summary: "Téléverser un fichier (PDF, vidéo, image)", description: "Upload direct dans le bucket `course-media` de Supabase Storage.\n\n" +
          "**Types acceptés** : `application/pdf`, `video/mp4`, `video/webm`, `video/quicktime`, `image/png`, `image/jpeg`.\n" +
          "**Taille max** : 500 Mo.\n" +
          "**Chemin** : `{courseId}/{timestamp}-{name}.{ext}`.\n" +
          "**Accès** : URL publique en lecture après upload.",
        parameters: [{ name: "path", in: "path", required: true, schema: { type: "string" }, example: "uuid-course/1719244800-chapitre1.pdf" }],
        requestBody: { content: { "*/*": { schema: { type: "string", format: "binary" } } } },
        responses: { "200": { description: "Fichier uploadé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── exams ── */
    "/rest/v1/exams": {
      get: { tags: ["Examens"], summary: "Lister les examens", parameters: [{ name: "program_course_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" }, example: "eq.ouvert" }],
        responses: { "200": { description: "Examens", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Exam" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Examens"], summary: "Créer un examen (enseignant)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Exam" } } } }, responses: { "201": { description: "Créé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Examens"], summary: "Modifier / ouvrir / clôturer un examen", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["planifie", "ouvert", "termine"] }, title: { type: "string" }, duration_min: { type: "integer" }, shuffle: { type: "boolean" } } } } } }, responses: { "204": { description: "Modifié" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Examens"], summary: "Supprimer un examen", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── exam_questions ── */
    "/rest/v1/exam_questions": {
      get: { tags: ["Questions"], summary: "Questions d'un examen", parameters: [{ name: "exam_id", in: "query", required: true, schema: { type: "string" } }, { name: "order", in: "query", schema: { type: "string" }, example: "ordre.asc" }],
        responses: { "200": { description: "Questions", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ExamQuestion" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Questions"], summary: "Ajouter une question", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ExamQuestion" } } } }, responses: { "201": { description: "Ajoutée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Questions"], summary: "Modifier une question", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ExamQuestion" } } } }, responses: { "204": { description: "Modifiée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Questions"], summary: "Supprimer une question", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── exam_attempts ── */
    "/rest/v1/exam_attempts": {
      get: { tags: ["Tentatives"], summary: "Tentatives d'examen", description: "Filtrables par examen, étudiant, statut. Contient les réponses, le score et les alertes anti-triche.",
        parameters: [{ name: "exam_id", in: "query", schema: { type: "string" } }, { name: "student_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" }, example: "eq.soumis" }],
        responses: { "200": { description: "Tentatives", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ExamAttempt" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Tentatives"], summary: "Démarrer une tentative", description: "Crée une tentative avec `status=encours`. Une seule tentative autorisée par étudiant par examen (contrainte unique).",
        requestBody: { content: { "application/json": { schema: { type: "object", required: ["exam_id", "student_id"], properties: { exam_id: uuid, student_id: uuid } } } } }, responses: { "201": { description: "Tentative démarrée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Tentatives"], summary: "Soumettre / corriger une tentative", description: "Soumettre : `status=soumis`, `answers={...}`, `submitted_at`. Corriger (enseignant) : `status=corrige`, `score`, `feedback`.",
        parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["encours", "soumis", "corrige"] }, answers: { type: "object", description: "Réponses : {question_id: choix_ou_texte}" }, score: nullable({ type: "number" }), score_max: nullable({ type: "number" }), feedback: nullable({ type: "string" }), alerts: { type: "array", items: { $ref: "#/components/schemas/Alert" }, description: "Alertes anti-triche enregistrées" } } } } } },
        responses: { "204": { description: "Modifiée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── deliberations ── */
    "/rest/v1/deliberations": {
      get: { tags: ["Délibérations"], summary: "Lister les délibérations", description: "Notes, crédits et statut de validation par le jury. Filtrables par matière, étudiant, statut.",
        parameters: [{ name: "program_course_id", in: "query", schema: { type: "string" } }, { name: "student_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" }, example: "eq.valide" }],
        responses: { "200": { description: "Délibérations", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Deliberation" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Délibérations"], summary: "Créer / soumettre une délibération (jury)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Deliberation" } } } }, responses: { "201": { description: "Créée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Délibérations"], summary: "Valider / rejeter une délibération", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["en_delib", "valide", "rejete"] }, note: nullable({ type: "number" }), credits: { type: "integer" }, validated_by: uuid, comment: nullable({ type: "string" }) } } } } },
        responses: { "204": { description: "Modifiée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── lives ── */
    "/rest/v1/lives": {
      get: { tags: ["Lives"], summary: "Classes virtuelles", description: "Filtrables par matière, statut. Realtime activé (Supabase Channels) pour les notifications en direct.",
        parameters: [{ name: "program_course_id", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" }, example: "eq.encours" }],
        responses: { "200": { description: "Lives", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Live" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Lives"], summary: "Planifier une classe virtuelle", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Live" } } } }, responses: { "201": { description: "Planifiée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Lives"], summary: "Démarrer / terminer un live", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["planifie", "encours", "termine"] }, started_at: nullable(ts), ended_at: nullable(ts) } } } } },
        responses: { "204": { description: "Modifié" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Lives"], summary: "Supprimer un live", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── remote_machines ── */
    "/rest/v1/remote_machines": {
      get: { tags: ["TP & Machines"], summary: "Machines distantes (terminaux web)", description: "Machines Linux accessibles via ttyd, wetty, Guacamole ou VNC. Filtrables par statut, OS, type.",
        parameters: [{ name: "status", in: "query", schema: { type: "string" }, example: "eq.up" }, { name: "kind", in: "query", schema: { type: "string" }, example: "eq.ttyd" }],
        responses: { "200": { description: "Machines", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/RemoteMachine" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["TP & Machines"], summary: "Ajouter une machine (admin)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/RemoteMachine" } } } }, responses: { "201": { description: "Ajoutée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["TP & Machines"], summary: "Modifier une machine", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/RemoteMachine" } } } }, responses: { "204": { description: "Modifiée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["TP & Machines"], summary: "Supprimer une machine", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── Piston (Code Sandbox) ── */
    "/piston/api/v2/runtimes": {
      get: { tags: ["Code Sandbox"], summary: "Langages disponibles (Piston)", description: "Retourne la liste des runtimes Piston. Endpoint externe : `https://emkc.org/api/v2/piston/runtimes`.",
        responses: { "200": { description: "Runtimes", content: { "application/json": { schema: { type: "array", items: { type: "object", properties: { language: { type: "string" }, version: { type: "string" }, aliases: { type: "array", items: { type: "string" } } } } } } } } },
      },
    },
    "/piston/api/v2/execute": {
      post: { tags: ["Code Sandbox"], summary: "Exécuter du code (Piston)", description: "Exécute du code dans un conteneur isolé. 60+ langages supportés (Python, JS, C, C++, Java…). Endpoint externe : `https://emkc.org/api/v2/piston/execute`.",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["language", "version", "files"],
          properties: { language: { type: "string", example: "python" }, version: { type: "string", example: "3.10.0" }, files: { type: "array", items: { type: "object", required: ["content"], properties: { name: { type: "string", example: "main.py" }, content: { type: "string", example: "print('Hello CAMA')" } } } }, stdin: { type: "string", description: "Entrée standard" } } } } } },
        responses: { "200": { description: "Résultat de l'exécution", content: { "application/json": { schema: { type: "object", properties: { run: { type: "object", properties: { stdout: { type: "string" }, stderr: { type: "string" }, code: { type: "integer" }, signal: nullable({ type: "string" }) } }, compile: nullable({ type: "object", properties: { stdout: { type: "string" }, stderr: { type: "string" } } }) } } } } } },
      },
    },

    /* ── calendar_events ── */
    "/rest/v1/calendar_events": {
      get: { tags: ["Calendrier"], summary: "Événements du calendrier académique", parameters: [{ name: "academic_year", in: "query", schema: { type: "string" }, example: "eq.2025-2026" }, { name: "type", in: "query", schema: { type: "string" }, example: "eq.examen" }, { name: "order", in: "query", schema: { type: "string" }, example: "sort_date.asc" }],
        responses: { "200": { description: "Événements", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/CalendarEvent" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Calendrier"], summary: "Ajouter un événement (admin)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CalendarEvent" } } } }, responses: { "201": { description: "Ajouté" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Calendrier"], summary: "Supprimer un événement", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── attendance ── */
    "/rest/v1/attendance": {
      get: { tags: ["Présences"], summary: "Enregistrements de présence", description: "Présence par matière, date, étudiant. Filtrables par cycle et mode.",
        parameters: [{ name: "program_course_id", in: "query", schema: { type: "string" } }, { name: "session_date", in: "query", schema: { type: "string" }, example: "eq.2025-06-24" }, { name: "student_id", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Présences", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Attendance" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Présences"], summary: "Marquer la présence (enseignant)", description: "Contrainte unique sur (program_course_id, student_id, session_date).",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Attendance" } } } }, responses: { "201": { description: "Marquée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── extra_courses ── */
    "/rest/v1/extra_courses": {
      get: { tags: ["Cours hors-cursus"], summary: "Catalogue des cours hors-cursus", parameters: [{ name: "published", in: "query", schema: { type: "string" }, example: "eq.true" }, { name: "category", in: "query", schema: { type: "string" }, example: "eq.Tech" }],
        responses: { "200": { description: "Cours", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ExtraCourse" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Cours hors-cursus"], summary: "Créer un cours hors-cursus (admin)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ExtraCourse" } } } }, responses: { "201": { description: "Créé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Cours hors-cursus"], summary: "Modifier un cours hors-cursus", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ExtraCourse" } } } }, responses: { "204": { description: "Modifié" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Cours hors-cursus"], summary: "Supprimer un cours hors-cursus", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── extra_enrollments ── */
    "/rest/v1/extra_enrollments": {
      get: { tags: ["Inscriptions hors-cursus"], summary: "Inscriptions aux cours hors-cursus", parameters: [{ name: "extra_course_id", in: "query", schema: { type: "string" } }, { name: "student_id", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Inscriptions", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ExtraEnrollment" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Inscriptions hors-cursus"], summary: "S'inscrire à un cours hors-cursus", requestBody: { content: { "application/json": { schema: { type: "object", required: ["extra_course_id", "student_id"], properties: { extra_course_id: uuid, student_id: uuid } } } } }, responses: { "201": { description: "Inscrit" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Inscriptions hors-cursus"], summary: "Mettre à jour la progression / satisfaction", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["inscrit", "en_cours", "termine", "abandon"] }, progress: { type: "integer", minimum: 0, maximum: 100 }, satisfaction: nullable({ type: "integer", minimum: 1, maximum: 5 }) } } } } },
        responses: { "204": { description: "Modifié" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Inscriptions hors-cursus"], summary: "Se désinscrire", parameters: [{ name: "extra_course_id", in: "query", required: true, schema: { type: "string" } }, { name: "student_id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Désinscrit" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── certifications ── */
    "/rest/v1/certifications": {
      get: { tags: ["Certifications"], summary: "Catalogue de certifications professionnelles", parameters: [{ name: "published", in: "query", schema: { type: "string" }, example: "eq.true" }, { name: "provider", in: "query", schema: { type: "string" }, example: "eq.AWS" }, { name: "level", in: "query", schema: { type: "string" }, example: "eq.Associate" }],
        responses: { "200": { description: "Certifications", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Certification" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Certifications"], summary: "Ajouter une certification (admin)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Certification" } } } }, responses: { "201": { description: "Ajoutée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Certifications"], summary: "Modifier une certification", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Certification" } } } }, responses: { "204": { description: "Modifiée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Certifications"], summary: "Supprimer une certification", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── certification_enrollments ── */
    "/rest/v1/certification_enrollments": {
      get: { tags: ["Inscriptions certif."], summary: "Inscriptions aux certifications", parameters: [{ name: "certification_id", in: "query", schema: { type: "string" } }, { name: "student_id", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Inscriptions", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/CertEnrollment" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Inscriptions certif."], summary: "S'inscrire à une certification", requestBody: { content: { "application/json": { schema: { type: "object", required: ["certification_id", "student_id"], properties: { certification_id: uuid, student_id: uuid } } } } }, responses: { "201": { description: "Inscrit" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Inscriptions certif."], summary: "Mettre à jour progression / score / statut", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["inscrit", "en_cours", "obtenu", "echec"] }, progress: { type: "integer", minimum: 0, maximum: 100 }, score: nullable({ type: "string" }) } } } } },
        responses: { "204": { description: "Modifié" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── journal_articles ── */
    "/rest/v1/journal_articles": {
      get: { tags: ["Journal"], summary: "Articles du Journal JFN", description: "Articles multi-média (image, vidéo, audio, reel, live). Recherche plein-texte via `?search_vector=fts.french.terme`.",
        parameters: [{ name: "published", in: "query", schema: { type: "string" }, example: "eq.true" }, { name: "rubrique", in: "query", schema: { type: "string" }, example: "eq.Podcast" }, { name: "featured", in: "query", schema: { type: "string" }, example: "eq.true" }, { name: "order", in: "query", schema: { type: "string" }, example: "created_at.desc" }],
        responses: { "200": { description: "Articles", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/JournalArticle" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Journal"], summary: "Publier un article (admin)", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/JournalArticle" } } } }, responses: { "201": { description: "Créé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      patch: { tags: ["Journal"], summary: "Modifier un article (contenu, média, mise en vedette)", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/JournalArticle" } } } }, responses: { "204": { description: "Modifié" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Journal"], summary: "Supprimer un article", parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprimé" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },

    /* ── journal_reactions ── */
    "/rest/v1/journal_reactions": {
      get: { tags: ["Réactions Journal"], summary: "Réactions (likes / saves)", parameters: [{ name: "article_id", in: "query", schema: { type: "string" } }, { name: "user_id", in: "query", schema: { type: "string" } }, { name: "kind", in: "query", schema: { type: "string" }, example: "eq.like" }],
        responses: { "200": { description: "Réactions", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/JournalReaction" } } } } } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      post: { tags: ["Réactions Journal"], summary: "Ajouter une réaction", description: "Contrainte unique sur (article_id, user_id, kind). Utiliser `upsert` pour toggle.", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/JournalReaction" } } } }, responses: { "201": { description: "Ajoutée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
      delete: { tags: ["Réactions Journal"], summary: "Retirer une réaction", parameters: [{ name: "article_id", in: "query", required: true, schema: { type: "string" } }, { name: "user_id", in: "query", required: true, schema: { type: "string" } }, { name: "kind", in: "query", required: true, schema: { type: "string" } }], responses: { "204": { description: "Retirée" } }, security: [{ bearerAuth: [], supabaseKey: [] }] },
    },
  },

  /* ════════════════════════════════════════════════════════════════
   *  COMPONENTS
   * ════════════════════════════════════════════════════════════════ */
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "JWT de session Supabase Auth (obtenu via `/auth/v1/token`)" },
      supabaseKey: { type: "apiKey", in: "header", name: "apikey", description: "Clé publique anon du projet Supabase (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)" },
    },
    schemas: {
      Error: { type: "object", properties: { error: { type: "string" } } },

      WebResult: { type: "object", properties: { title: { type: "string" }, url: { type: "string", format: "uri" }, description: { type: "string" }, source: { type: "string" }, age: { type: "string" } } },

      User: { type: "object", required: ["id", "email", "first_name", "last_name", "role"],
        properties: { id: uuid, email: { type: "string", format: "email" }, first_name: { type: "string", example: "Amina" }, last_name: { type: "string", example: "Bello" }, role: { type: "string", enum: ["etudiant", "enseignant", "admin", "jury"] }, avatar_color: { type: "string", example: "#7C3AED" }, school: nullable({ type: "string" }), level: nullable({ type: "string" }), phone: nullable({ type: "string" }), phone_prefix: nullable({ type: "string" }), student_card: nullable({ type: "string" }), created_at: ts } },
      UserPatch: { type: "object", properties: { role: { type: "string", enum: ["etudiant", "enseignant", "admin", "jury"] }, avatar_color: { type: "string" }, phone: nullable({ type: "string" }), phone_prefix: nullable({ type: "string" }), school: nullable({ type: "string" }), level: nullable({ type: "string" }) } },

      Inscription: { type: "object", required: ["user_id", "matricule", "parcours_slug"],
        properties: { id: uuid, user_id: uuid, matricule: { type: "string", example: "JFN-2025-0042" }, parcours_slug: { type: "string", example: "genie-logiciel" }, parcours_title: { type: "string", example: "Génie Logiciel" }, school: { type: "string", example: "ESTI" }, cycle_type: { type: "string", example: "Licence" }, level: { type: "string", example: "L1" }, mode: { type: "string", enum: ["online", "hybride", "presentiel"] }, campus: { type: "string", example: "Yaoundé" }, academic_year: { type: "string", example: "2025-2026" }, semester: { type: "integer", example: 1 }, total_ects: { type: "integer", example: 30 }, status: { type: "string", enum: ["en_attente", "validee", "rejetee"] }, enrolled_at: ts } },

      ProgramCourse: { type: "object", required: ["parcours_slug", "code", "title"],
        properties: { id: uuid, parcours_slug: { type: "string" }, parcours_title: { type: "string" }, annee_niveau: { type: "string", example: "L1", description: "L1..M2" }, semestre: { type: "string", example: "S1", description: "S1..S6" }, code: { type: "string", example: "INF201" }, title: { type: "string", example: "Structures de données" }, ects: { type: "integer", example: 6 }, hours: { type: "integer", example: 60, description: "Volume horaire total" }, modalites: { type: "array", items: { type: "string" }, example: ["video", "pdf", "live"] }, evaluation: nullable({ type: "string" }), ordre: { type: "integer" }, teacher_id: nullable(uuid), academic_year: nullable({ type: "string" }), description: nullable({ type: "string" }), objectives: { type: "array", items: { type: "string" } }, competences: { type: "array", items: { type: "string" } }, prerequis: nullable({ type: "string" }), audience: nullable({ type: "string" }), difficulte: nullable({ type: "string" }), published: { type: "boolean" }, prof_ia: { type: "boolean", description: "Activer le Prof IA pour ce cours" }, created_at: ts } },
      ProgramCoursePatch: { type: "object", properties: { teacher_id: nullable(uuid), published: { type: "boolean" }, description: nullable({ type: "string" }), objectives: { type: "array", items: { type: "string" } }, competences: { type: "array", items: { type: "string" } }, hours: { type: "integer" } } },

      Chapter: { type: "object", required: ["program_course_id", "ordre", "title"],
        properties: { id: uuid, program_course_id: uuid, ordre: { type: "integer" }, title: { type: "string" },
          pdf: nullable({ type: "object", properties: { name: { type: "string" }, sizeMo: { type: "number" }, pages: { type: "integer" }, url: { type: "string" } } }),
          video: nullable({ type: "object", properties: { title: { type: "string" }, durationMin: { type: "number" }, transcript: { type: "string" }, sizeMo: { type: "number" }, url: { type: "string" }, quality: { type: "string" } } }),
          natif: nullable({ type: "object", description: "Contenu natif CAMA (blocs structurés)", properties: { blocks: { type: "array", items: { type: "object" } } } }),
          live_id: nullable(uuid), created_at: ts } },
      ChapterCreate: { type: "object", required: ["program_course_id", "title", "ordre"], properties: { program_course_id: uuid, title: { type: "string" }, ordre: { type: "integer" } } },
      ChapterPatch: { type: "object", properties: { title: { type: "string" }, pdf: nullable({ type: "object" }), video: nullable({ type: "object" }), natif: nullable({ type: "object" }) } },

      ChapterProgress: { type: "object", required: ["student_id", "chapter_id"], properties: { student_id: uuid, chapter_id: uuid, done_at: ts } },

      Session: { type: "object", required: ["program_course_id", "title", "kind"],
        properties: { id: uuid, program_course_id: uuid, title: { type: "string" }, day: nullable({ type: "string", example: "Lundi" }), start_time: nullable({ type: "string", example: "08:00" }), end_time: nullable({ type: "string", example: "10:00" }), kind: { type: "string", enum: ["campus", "live", "async", "examen"] }, room: nullable({ type: "string" }), modes: { type: "array", items: { type: "string", enum: ["online", "hybride", "presentiel"] } }, academic_year: nullable({ type: "string" }), semestre: nullable({ type: "string" }), week_start: nullable({ type: "string" }), status: { type: "string", enum: ["propose", "valide", "rejete"] }, proposed_by: nullable(uuid), created_at: ts } },

      CourseResource: { type: "object", required: ["program_course_id", "kind", "title"],
        properties: { id: uuid, program_course_id: uuid, kind: { type: "string", enum: ["syllabus", "support", "biblio", "lien"] }, title: { type: "string" }, url: nullable({ type: "string", format: "uri" }), size_mo: nullable({ type: "number" }), created_by: nullable(uuid), created_at: ts } },

      Exam: { type: "object", required: ["program_course_id", "title", "duration_min"],
        properties: { id: uuid, program_course_id: uuid, title: { type: "string", example: "Examen final INF201" }, duration_min: { type: "integer", example: 90, description: "Durée en minutes" }, status: { type: "string", enum: ["planifie", "ouvert", "termine"] }, scheduled_at: nullable(ts), shuffle: { type: "boolean", description: "Mélanger l'ordre des questions" }, created_by: nullable(uuid), created_at: ts } },

      ExamQuestion: { type: "object", required: ["exam_id", "ordre", "type", "text", "points"],
        properties: { id: uuid, exam_id: uuid, ordre: { type: "integer" }, type: { type: "string", enum: ["qcm", "ouverte"] }, text: { type: "string", example: "Quelle est la complexité du tri par fusion ?" }, options: { type: "array", items: { type: "string" }, example: ["O(n)", "O(n²)", "O(n log n)", "O(log n)"], description: "Choix (QCM uniquement)" }, correct_index: nullable({ type: "integer", description: "Index de la bonne réponse (0-based, QCM)" }), points: { type: "number", example: 2 } } },

      ExamAttempt: { type: "object", required: ["exam_id", "student_id"],
        properties: { id: uuid, exam_id: uuid, student_id: uuid, status: { type: "string", enum: ["encours", "soumis", "corrige"] }, started_at: ts, submitted_at: nullable(ts), answers: { type: "object", additionalProperties: true, description: "Réponses : {question_id: index_ou_texte}" }, score: nullable({ type: "number" }), score_max: nullable({ type: "number" }), feedback: nullable({ type: "string" }), alerts: { type: "array", items: { $ref: "#/components/schemas/Alert" }, description: "Alertes anti-triche enregistrées pendant l'examen" } } },

      Alert: { type: "object", description: "Alerte anti-triche", properties: { time: { type: "string", description: "Horodatage ISO" }, type: { type: "string", enum: ["onglet", "copier", "coller", "plein-ecran", "saisie"], description: "Type de violation" }, detail: { type: "string" } } },

      Deliberation: { type: "object", required: ["program_course_id", "student_id"],
        properties: { id: uuid, program_course_id: uuid, student_id: uuid, attempt_id: nullable(uuid), note: nullable({ type: "number", description: "Note sur 20" }), credits: { type: "integer", description: "Crédits ECTS attribués" }, status: { type: "string", enum: ["en_delib", "valide", "rejete"] }, validated_by: nullable(uuid), validated_at: nullable(ts), comment: nullable({ type: "string" }), created_at: ts } },

      Live: { type: "object", required: ["title"],
        properties: { id: uuid, program_course_id: nullable(uuid), chapter_id: nullable(uuid), title: { type: "string", example: "TD Arbres binaires — INF201" }, status: { type: "string", enum: ["planifie", "encours", "termine"] }, started_at: nullable(ts), ended_at: nullable(ts), created_by: nullable(uuid), created_at: ts } },

      RemoteMachine: { type: "object", required: ["name", "os", "kind", "web_url"],
        properties: { id: uuid, name: { type: "string", example: "Debian-Lab-01" }, os: { type: "string", example: "Debian 12" }, kind: { type: "string", enum: ["ttyd", "wetty", "guacamole", "vnc", "other"] }, web_url: { type: "string", format: "uri", description: "URL HTTPS du terminal web" }, description: nullable({ type: "string" }), status: { type: "string", enum: ["up", "down", "unknown"] }, added_by: nullable(uuid), created_at: ts } },

      CalendarEvent: { type: "object", required: ["date_label", "label", "type", "academic_year"],
        properties: { id: uuid, date_label: { type: "string", example: "15 sept. 2025" }, sort_date: nullable({ type: "string", format: "date" }), label: { type: "string", example: "Rentrée académique" }, type: { type: "string", enum: ["cours", "examen", "jury", "resultat", "admin", "vacances", "event"] }, semester: { type: "integer", example: 1 }, academic_year: { type: "string", example: "2025-2026" }, created_by: nullable(uuid), created_at: ts } },

      Attendance: { type: "object", required: ["student_id", "session_date", "present"],
        properties: { id: uuid, program_course_id: nullable(uuid), session_id: nullable(uuid), student_id: uuid, session_date: { type: "string", format: "date" }, present: { type: "boolean" }, cycle: nullable({ type: "string", example: "L2" }), mode: nullable({ type: "string", enum: ["online", "hybride", "presentiel"] }), marked_by: nullable(uuid), created_at: ts } },

      ExtraCourse: { type: "object", required: ["title", "category"],
        properties: { id: uuid, title: { type: "string", example: "Leadership & Communication" }, code: nullable({ type: "string" }), category: { type: "string", enum: ["Soft skills", "Langues", "Entrepreneuriat", "Tech", "Arts & Culture", "Autre"] }, description: nullable({ type: "string" }), instructor_name: nullable({ type: "string" }), teacher_id: nullable(uuid), mode: { type: "string", enum: ["online", "hybride", "presentiel"] }, capacity: { type: "integer" }, day: nullable({ type: "string", example: "Mercredi" }), start_time: nullable({ type: "string", example: "14:00" }), end_time: nullable({ type: "string", example: "16:00" }), room: nullable({ type: "string" }), starts_on: nullable({ type: "string", format: "date" }), sessions_count: { type: "integer" }, color: { type: "string", example: "#7C3AED" }, published: { type: "boolean" }, created_by: nullable(uuid), created_at: ts } },

      ExtraEnrollment: { type: "object", required: ["extra_course_id", "student_id"],
        properties: { id: uuid, extra_course_id: uuid, student_id: uuid, status: { type: "string", enum: ["inscrit", "en_cours", "termine", "abandon"] }, progress: { type: "integer", minimum: 0, maximum: 100 }, satisfaction: nullable({ type: "integer", minimum: 1, maximum: 5, description: "Note de satisfaction (étoiles)" }), enrolled_at: ts } },

      Certification: { type: "object", required: ["title", "provider", "level"],
        properties: { id: uuid, title: { type: "string", example: "AWS Cloud Practitioner" }, provider: { type: "string", example: "AWS" }, code: nullable({ type: "string", example: "CLF-C02" }), description: nullable({ type: "string" }), level: { type: "string", enum: ["Fondation", "Associate", "Professionnel", "Expert"] }, duration_h: { type: "integer", example: 40 }, environment_url: nullable({ type: "string", format: "uri", description: "URL de l'environnement de labs" }), badge_color: { type: "string", example: "#FF9900" }, capacity: nullable({ type: "integer" }), exam_fee: nullable({ type: "string", example: "100 USD" }), published: { type: "boolean" }, created_by: nullable(uuid), created_at: ts } },

      CertEnrollment: { type: "object", required: ["certification_id", "student_id"],
        properties: { id: uuid, certification_id: uuid, student_id: uuid, status: { type: "string", enum: ["inscrit", "en_cours", "obtenu", "echec"] }, progress: { type: "integer", minimum: 0, maximum: 100 }, score: nullable({ type: "string", description: "Score de l'examen" }), started_at: ts, completed_at: nullable(ts) } },

      JournalArticle: { type: "object", required: ["rubrique", "title", "media_kind", "author"],
        properties: { id: uuid, rubrique: { type: "string", enum: ["À la une", "Direct", "Vie du campus", "Scolarité", "Podcast", "Ressources", "Sport", "Culture", "Tribune", "Campus"] }, title: { type: "string" }, subtitle: nullable({ type: "string" }), body: nullable({ type: "string" }),
          media_kind: { type: "string", enum: ["none", "image", "video", "audio", "reel", "live"], description: "Type de média principal" },
          media_src: nullable({ type: "string", format: "uri", description: "URL image/poster (pour image, vidéo, reel, live)" }),
          media_url: nullable({ type: "string", format: "uri", description: "URL de la ressource (mp4/mp3/lien live)" }),
          media_legend: nullable({ type: "string" }), media_duration: nullable({ type: "string", example: "2:14", description: "Durée du média (vidéo, audio, reel)" }),
          media_at: nullable({ type: "string", example: "Demain · 10h00", description: "Horaire (live uniquement)" }),
          author: { type: "string", example: "Rédaction JFN" }, cover_url: nullable({ type: "string", format: "uri", description: "Image de couverture (page éditions)" }),
          tags: { type: "array", items: { type: "string" }, example: ["hackathon", "tech"] }, refs: { type: "array", items: { type: "object", properties: { label: { type: "string" }, href: { type: "string" } } }, description: "Liens de référence" },
          cta_label: nullable({ type: "string" }), cta_href: nullable({ type: "string" }), featured: { type: "boolean", description: "Affiché en « À la une »" }, published: { type: "boolean" },
          views: { type: "integer" }, created_by: nullable(uuid), created_at: ts, updated_at: ts } },

      JournalReaction: { type: "object", required: ["article_id", "user_id", "kind"],
        properties: { id: uuid, article_id: uuid, user_id: uuid, kind: { type: "string", enum: ["like", "save"] }, created_at: ts } },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
