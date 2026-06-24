import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Spécification OpenAPI 3.0 de l'API CAMA.
 * Servie en JSON et consommée par Swagger UI (/api-docs).
 *
 * CAMA expose deux familles d'API :
 *  1. Les routes Next.js natives (/api/*) documentées ci-dessous en détail.
 *  2. L'API de données Supabase (PostgREST) générée automatiquement sur
 *     https://<projet>.supabase.co/rest/v1/<table>. Les tables principales
 *     sont décrites dans le tag « Données (Supabase) » à titre de référence.
 */
const spec = {
  openapi: "3.0.3",
  info: {
    title: "CAMA API",
    version: "1.0.0",
    description:
      "API de la plateforme CAMA — LMS de l'Institut JFN.\n\n" +
      "Couvre la visioconférence (JaaS), la recherche web (Brave) et la couche " +
      "de données Supabase (cours, examens, journal, certifications…).",
    contact: { name: "Institut JFN", url: "https://jfn-univ.com" },
  },
  servers: [
    { url: "/", description: "Serveur courant" },
  ],
  tags: [
    { name: "Visioconférence", description: "Génération de jetons pour les classes virtuelles (Jitsi / JaaS 8x8)." },
    { name: "Recherche", description: "CAMA Search — recherche web via Brave Search API." },
    { name: "Documentation", description: "Spécification et interface Swagger." },
    { name: "Données (Supabase)", description: "Référence des principales ressources PostgREST (auth + clé API requises)." },
  ],
  paths: {
    "/api/jitsi-token": {
      post: {
        tags: ["Visioconférence"],
        summary: "Génère un JWT JaaS pour rejoindre une salle Jitsi",
        description:
          "Signe un jeton RS256 permettant à l'utilisateur de rejoindre une classe virtuelle. " +
          "Les enseignants reçoivent le rôle modérateur. Nécessite JAAS_APP_ID / JAAS_KEY_ID / JAAS_PRIVATE_KEY.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["room", "name", "id"],
                properties: {
                  room: { type: "string", example: "CAMA-INF201-live" },
                  name: { type: "string", example: "Amina Bello" },
                  email: { type: "string", format: "email", example: "amina@jfn.cm" },
                  id: { type: "string", example: "user-uuid" },
                  moderator: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Jeton généré",
            content: { "application/json": { schema: { type: "object", properties: { jwt: { type: "string" }, appId: { type: "string" } } } } },
          },
          "500": { description: "JaaS non configuré", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/search": {
      get: {
        tags: ["Recherche"],
        summary: "Recherche web (multi-provider)",
        description: "Renvoie des résultats web pour enrichir CAMA Search. Provider auto selon l'env " +
          "(TAVILY_API_KEY > SERPER_API_KEY > BRAVE_API_KEY). Sans aucune clé, retombe sur l'API Wikipédia (gratuit).",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Termes de recherche", example: "complexité algorithmique" },
          { name: "count", in: "query", required: false, schema: { type: "integer", default: 8, maximum: 20 }, description: "Nombre de résultats" },
        ],
        responses: {
          "200": {
            description: "Liste de résultats web (tableau vide si la clé est absente)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    query: { type: "string" },
                    results: { type: "array", items: { $ref: "#/components/schemas/WebResult" } },
                    error: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/openapi": {
      get: {
        tags: ["Documentation"],
        summary: "Spécification OpenAPI brute (JSON)",
        responses: { "200": { description: "Document OpenAPI 3.0", content: { "application/json": {} } } },
      },
    },
    "/rest/v1/journal_articles": {
      get: {
        tags: ["Données (Supabase)"],
        summary: "Articles du Journal JFN",
        description: "Endpoint PostgREST Supabase. Filtrage : `?published=eq.true&order=created_at.desc`. Auth Bearer + apikey requis.",
        parameters: [
          { name: "published", in: "query", schema: { type: "string" }, example: "eq.true" },
          { name: "order", in: "query", schema: { type: "string" }, example: "created_at.desc" },
        ],
        responses: { "200": { description: "Articles", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/JournalArticle" } } } } } },
        security: [{ supabaseKey: [], bearerAuth: [] }],
      },
    },
    "/rest/v1/program_courses": {
      get: { tags: ["Données (Supabase)"], summary: "Cours du programme académique", responses: { "200": { description: "Cours" } }, security: [{ supabaseKey: [], bearerAuth: [] }] },
    },
    "/rest/v1/exams": {
      get: { tags: ["Données (Supabase)"], summary: "Examens", responses: { "200": { description: "Examens" } }, security: [{ supabaseKey: [], bearerAuth: [] }] },
    },
    "/rest/v1/certifications": {
      get: { tags: ["Données (Supabase)"], summary: "Certifications", responses: { "200": { description: "Certifications" } }, security: [{ supabaseKey: [], bearerAuth: [] }] },
    },
    "/rest/v1/lives": {
      get: { tags: ["Données (Supabase)"], summary: "Classes virtuelles", responses: { "200": { description: "Lives" } }, security: [{ supabaseKey: [], bearerAuth: [] }] },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "JWT de session Supabase Auth" },
      supabaseKey: { type: "apiKey", in: "header", name: "apikey", description: "Clé anon/publique Supabase" },
    },
    schemas: {
      Error: { type: "object", properties: { error: { type: "string" } } },
      WebResult: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string", format: "uri" },
          description: { type: "string" },
          source: { type: "string" },
          age: { type: "string" },
        },
      },
      JournalArticle: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          rubrique: { type: "string", example: "À la une" },
          title: { type: "string" },
          subtitle: { type: "string", nullable: true },
          body: { type: "string", nullable: true },
          media_kind: { type: "string", enum: ["none", "image", "video", "audio", "reel", "live"] },
          media_src: { type: "string", nullable: true },
          media_duration: { type: "string", nullable: true },
          author: { type: "string" },
          cover_url: { type: "string", nullable: true },
          tags: { type: "array", items: { type: "string" } },
          featured: { type: "boolean" },
          published: { type: "boolean" },
          views: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
