"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Globe } from "lucide-react";
import AuthPanel from "@/components/auth/AuthPanel";

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [role,    setRole]    = useState<"etudiant"|"enseignant"|"admin">("etudiant");

  return (
    <div className="min-h-screen grid lg:grid-cols-[42%_58%]">

      {/* ── Panel gauche — Africanitude ── */}
      <div className="hidden lg:block">
        <AuthPanel />
      </div>

      {/* ── Panel droit — Formulaire ── */}
      <div className="flex flex-col min-h-screen bg-white">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <button className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors border border-border rounded-full px-3 py-1.5">
            <Globe className="w-3.5 h-3.5" />
            Français
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-md">

            <h1 className="text-3xl font-light text-ink mb-1">Bienvenue !</h1>
            <p className="text-muted text-sm mb-8">Connectez-vous à votre compte CAMA.</p>

            {/* Sélecteur de rôle — originalité CAMA */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Je suis</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "etudiant",   label: "Étudiant" },
                  { id: "enseignant", label: "Enseignant" },
                  { id: "admin",      label: "Administrateur" },
                ] as const).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setRole(id)}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all duration-150 ${
                      role === id
                        ? "border-cama bg-cama text-white"
                        : "border-border text-muted hover:border-cama/40 hover:text-cama"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Champs */}
            <div className="space-y-4 mb-2">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="votre@email.cm"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder-subtle outline-none focus:border-cama focus:ring-2 focus:ring-cama/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full border border-border rounded-xl px-4 py-3 pr-11 text-sm text-ink placeholder-subtle outline-none focus:border-cama focus:ring-2 focus:ring-cama/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-ink transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Mot de passe oublié */}
            <div className="flex justify-end mb-6">
              <Link href="/auth/reset" className="text-sm text-cama hover:underline font-medium">
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton connexion */}
            <button className="w-full btn-primary py-3.5 text-base rounded-xl justify-center mb-4">
              Se connecter
            </button>

            {/* Séparateur */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-subtle">Ou continuer avec</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google */}
            <button className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-3 text-sm font-medium text-ink hover:bg-surface hover:border-cama/30 transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            {/* Lien inscription */}
            <p className="text-center text-sm text-muted mt-8">
              Pas encore de compte ?{" "}
              <Link href="/auth/register" className="text-cama font-bold hover:underline">
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
