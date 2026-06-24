"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileJson } from "lucide-react";

/**
 * Documentation interactive de l'API CAMA via Swagger UI.
 * Swagger UI est chargé depuis le CDN (aucune dépendance npm ajoutée)
 * et pointe sur la spécification servie par /api/openapi.
 */
const SWAGGER_VERSION = "5.17.14";

export default function ApiDocsPage() {
  useEffect(() => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`;
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      // @ts-expect-error — SwaggerUIBundle est injecté globalement par le script CDN
      window.SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
      });
    };
    document.body.appendChild(script);

    return () => {
      css.remove();
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink">Documentation API — CAMA</span>
          <div className="flex-1" />
          <a href="/api/openapi" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-cama hover:underline">
            <FileJson className="w-4 h-4" /> openapi.json
          </a>
        </div>
      </header>
      <div id="swagger-ui" className="max-w-[1300px] mx-auto" />
    </div>
  );
}
