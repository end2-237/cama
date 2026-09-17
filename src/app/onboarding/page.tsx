"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Users, Palette, BookOpen } from "lucide-react";
import { fetchOrgBySlug, DBOrganization } from "@/lib/org";
import { applyTheme } from "@/lib/theme";
import AuthPanel from "@/components/auth/AuthPanel";

function OnboardingInner() {
  const params = useSearchParams();
  const slug = params.get("org") ?? "";
  const [org, setOrg] = useState<DBOrganization | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const o = await fetchOrgBySlug(slug);
      setOrg(o);
      applyTheme(document.documentElement, o.primary_color, o.accent_color);
    })();
  }, [slug]);

  const loginHref = `/auth/login?org=${slug}`;

  return (
    <div className="min-h-screen grid lg:grid-cols-[42%_58%]">

      <div className="hidden lg:block"><AuthPanel /></div>

      <div className="flex flex-col min-h-screen bg-white animate-fade-in">
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-md animate-fade-up delay-100">
            <div className="w-14 h-14 rounded-full bg-cama/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-cama" />
            </div>
            <h1 className="text-2xl font-bold text-ink mb-1">
              {org ? `Bienvenue, ${org.name} !` : "Votre établissement est prêt !"}
            </h1>
            <p className="text-muted text-sm mb-6">
              Votre espace CAMA est créé. Voici les prochaines étapes pour le mettre en route.
            </p>

            <div className="space-y-3 mb-7">
              {[
                { icon: Palette, t: "Personnaliser l'identité", d: "Logo, couleurs et libellés de votre établissement." },
                { icon: BookOpen, t: "Créer votre programme", d: "Niveaux, modules ou cursus selon votre type." },
                { icon: Users, t: "Inviter enseignants & étudiants", d: "Ajoutez vos premiers comptes." },
              ].map((s) => (
                <div key={s.t} className="flex items-start gap-3 border border-border rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-cama/8 flex items-center justify-center flex-shrink-0">
                    <s.icon className="w-4 h-4 text-cama" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{s.t}</p>
                    <p className="text-xs text-muted">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href={loginHref} className="btn-primary w-full">
              Accéder à mon espace <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[11px] text-muted mt-3">
              Adresse de votre espace : <span className="font-semibold text-ink">{slug || "votre-institut"}.cama.app</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <OnboardingInner />
    </Suspense>
  );
}
