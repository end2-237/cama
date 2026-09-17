"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Loader2, AlertCircle, Check } from "lucide-react";
import AuthPanel from "@/components/auth/AuthPanel";

const VERTICALS = [
  { id: "academique", label: "Académique", desc: "Université, institut, cursus & ECTS" },
  { id: "langues", label: "Langues", desc: "École de langues, niveaux A1→C2" },
  { id: "pro", label: "Formation pro", desc: "Centre pro, modules & certifications" },
] as const;

const PRESETS = ["#4F46E5", "#0EA5A4", "#2563EB", "#DB2777", "#F59E0B", "#16A34A", "#7C3AED", "#DC2626"];

export default function OrgSignupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [vertical, setVertical] = useState<string>("academique");
  const [primaryColor, setPrimaryColor] = useState("#4F46E5");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!orgName || !slug || !adminFirstName || !adminLastName || !adminEmail || adminPassword.length < 8) {
      setError("Complétez tous les champs (mot de passe ≥ 8 caractères).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/org/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName, subdomain: slug, vertical, primaryColor,
          adminEmail, adminPassword, adminFirstName, adminLastName,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Création impossible."); setLoading(false); return; }
      router.push(`/onboarding?org=${data.slug}`);
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[42%_58%]">

      <div className="hidden lg:block"><AuthPanel /></div>

      <div className="flex flex-col min-h-screen bg-white animate-fade-in">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border animate-fade-up">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
          <Link href="/auth/login" className="text-sm text-muted hover:text-ink">Déjà un espace ? Se connecter</Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <form onSubmit={submit} className="w-full max-w-md animate-fade-up delay-100">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-cama flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-ink">Créer votre établissement</h1>
            </div>
            <p className="text-muted text-sm mb-6">Lancez votre espace CAMA en une minute. Essai gratuit, sans carte.</p>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <label className="block text-xs font-semibold text-muted mb-1">Nom de l'établissement</label>
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)}
              placeholder="Institut Exemple" className="w-full border border-border rounded-lg px-3 py-2.5 mb-4 focus:border-cama outline-none" />

            <label className="block text-xs font-semibold text-muted mb-1">Adresse de l'espace</label>
            <div className="flex items-center mb-4">
              <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)}
                placeholder="mon-institut" className="flex-1 border border-border rounded-l-lg px-3 py-2.5 focus:border-cama outline-none" />
              <span className="px-3 py-2.5 bg-surface border border-l-0 border-border rounded-r-lg text-sm text-muted">.cama.app</span>
            </div>

            <label className="block text-xs font-semibold text-muted mb-1">Type d'établissement</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {VERTICALS.map((v) => (
                <button type="button" key={v.id} onClick={() => setVertical(v.id)}
                  className={`text-left border rounded-lg px-3 py-2 transition-colors ${vertical === v.id ? "border-cama bg-cama/5" : "border-border hover:border-cama/40"}`}>
                  <p className="text-sm font-semibold text-ink">{v.label}</p>
                  <p className="text-[10px] text-muted leading-tight mt-0.5">{v.desc}</p>
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-muted mb-1">Couleur de marque</label>
            <div className="flex items-center gap-2 mb-6">
              {PRESETS.map((c) => (
                <button type="button" key={c} onClick={() => setPrimaryColor(c)}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
                  style={{ backgroundColor: c, borderColor: primaryColor === c ? "#111827" : "transparent" }}>
                  {primaryColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-border" />
            </div>

            <div className="border-t border-border pt-5 mb-4">
              <p className="text-sm font-semibold text-ink mb-3">Votre compte administrateur</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)}
                  placeholder="Prénom" className="border border-border rounded-lg px-3 py-2.5 focus:border-cama outline-none" />
                <input value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)}
                  placeholder="Nom" className="border border-border rounded-lg px-3 py-2.5 focus:border-cama outline-none" />
              </div>
              <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} type="email"
                placeholder="admin@mon-institut.cm" className="w-full border border-border rounded-lg px-3 py-2.5 mb-3 focus:border-cama outline-none" />
              <input value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} type="password"
                placeholder="Mot de passe (≥ 8 caractères)" className="w-full border border-border rounded-lg px-3 py-2.5 focus:border-cama outline-none" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Création…</> : <>Créer mon établissement <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
