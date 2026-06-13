"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings, Wrench, Clock, ShieldCheck, Wifi, CheckCircle2,
  ArrowRight, Mail, Phone, RefreshCw, Server, Database, Bot, Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMaintenance } from "@/hooks/useMaintenance";
import { setMaintenance } from "@/lib/maintenance";

/* Tâches de maintenance affichées (purement illustratives) */
const TASKS = [
  { label: "Migration de la base de données", done: true },
  { label: "Mise à jour du module Safe-CAMA", done: true },
  { label: "Optimisation du CDN bas-débit", done: false, active: true },
  { label: "Redémarrage des services", done: false },
];

const SERVICES = [
  { icon: Server, label: "Serveur applicatif", state: "maintenance" },
  { icon: Database, label: "Base de données", state: "ok" },
  { icon: Bot, label: "Service Prof IA", state: "ok" },
  { icon: Wifi, label: "Passerelle SMS / USSD", state: "ok" },
];

function fmt(ms: number) {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { h, m, s: sec };
}

export default function MaintenancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const maint = useMaintenance();
  const [now, setNow] = useState(() => Date.now());

  /* horloge pour le compte à rebours */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const privileged = !!user && user.role !== "etudiant";
  const remaining = maint.until ? fmt(maint.until - now) : null;
  const progress = maint.since && maint.until
    ? Math.min(100, Math.max(4, Math.round(((now - maint.since) / (maint.until - maint.since)) * 100)))
    : 64;

  const disableAndGo = () => {
    setMaintenance(false);
    router.push("/dashboard");
  };

  /* Si la maintenance est levée, on propose le retour */
  const lifted = !maint.on;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-5 py-12"
      style={{ background: "linear-gradient(160deg, #1E1B4B 0%, #2D2A6E 50%, #1a1640 100%)" }}>

      {/* Motif kente + halos */}
      <div className="absolute inset-0 kente-pattern opacity-20" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cama-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-gold/10 blur-3xl" />

      {/* Formes flottantes décoratives */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice" fill="none">
        <g className="animate-float-slow" style={{ transformOrigin: "120px 160px" }}>
          <circle cx="120" cy="160" r="16" fill="#818CF8" opacity="0.6" />
          <circle cx="120" cy="160" r="26" fill="none" stroke="#818CF8" strokeWidth="1.5" opacity="0.25" />
        </g>
        <g className="animate-float-med" style={{ transformOrigin: "880px 120px" }}>
          <rect x="856" y="96" width="48" height="48" rx="4" fill="#F59E0B" opacity="0.7" transform="rotate(45 880 120)" />
        </g>
        <g className="animate-float-fast" style={{ transformOrigin: "900px 640px" }}>
          <polygon points="870,690 900,630 930,690" fill="#F59E0B" opacity="0.45" />
        </g>
        <g className="animate-drift" style={{ transformOrigin: "90px 660px" }}>
          <path d="M60 640 L90 623 L120 640 L120 674 L90 691 L60 674 Z" fill="#A5B4FC" opacity="0.45" />
        </g>
      </svg>

      <div className="relative w-full max-w-2xl">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-up">
          <div className="w-1.5 h-9 rounded-full bg-gradient-to-b from-cama-400 to-gold" />
          <div className="leading-tight text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">Institut JFN</span>
            <span className="block text-2xl font-bold leading-none text-white tracking-tight">
              CA<span className="text-gold">MA</span>
            </span>
          </div>
        </div>

        {/* Carte principale */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-7 sm:p-10 animate-scale-in shadow-2xl">

          {/* Engrenages animés */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <Settings className="absolute inset-0 w-20 h-20 text-cama-300/90" strokeWidth={1.2}
              style={{ animation: "spin 9s linear infinite" }} />
            <Wrench className="absolute -bottom-1 -right-1 w-9 h-9 text-gold bg-cama-900 rounded-full p-1.5 border border-white/10"
              style={{ animation: "spin 6s linear infinite reverse" }} />
          </div>

          {lifted ? (
            /* ── Maintenance levée ── */
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-green-300 bg-green-500/15 border border-green-400/20 px-3 py-1 rounded-full mb-4">
                <CheckCircle2 className="w-3.5 h-3.5" /> Service rétabli
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">La plateforme est de retour</h1>
              <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto mb-7">
                La maintenance est terminée. Merci de votre patience — vous pouvez reprendre votre parcours sur CAMA.
              </p>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-white font-bold text-sm px-7 py-3.5 rounded-full transition-all active:scale-95">
                Accéder à mon tableau de bord <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {/* ── Maintenance en cours ── */}
              <div className="text-center mb-7">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gold bg-gold/10 border border-gold/20 px-3 py-1 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Maintenance en cours
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
                  Nous améliorons <span className="text-gold">CAMA</span>
                </h1>
                <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
                  La plateforme est momentanément indisponible pour une maintenance planifiée.
                  Vos données et votre progression sont en sécurité — tout sera rétabli très vite.
                </p>
              </div>

              {/* Compte à rebours */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 text-center mb-3 flex items-center justify-center gap-1.5">
                  <Clock className="w-3 h-3" /> Retour estimé
                </p>
                {remaining ? (
                  <div className="flex items-center justify-center gap-3">
                    {[
                      { v: remaining.h, l: "heures" },
                      { v: remaining.m, l: "minutes" },
                      { v: remaining.s, l: "secondes" },
                    ].map((u, i) => (
                      <div key={u.l} className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="w-16 sm:w-20 bg-cama-900/60 border border-white/10 rounded-xl py-2.5">
                            <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{String(u.v).padStart(2, "0")}</span>
                          </div>
                          <p className="text-[9px] text-white/40 mt-1.5 uppercase tracking-wider">{u.l}</p>
                        </div>
                        {i < 2 && <span className="text-2xl font-black text-white/30 -mt-5">:</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-lg font-bold text-gold flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Finalisation en cours…
                  </p>
                )}

                {/* Barre de progression */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-[10px] text-white/40 mb-1.5">
                    <span>Progression de la maintenance</span>
                    <span className="font-bold text-white/70">{progress}%</span>
                  </div>
                  <div className="h-2 bg-cama-900/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cama-400 to-gold rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              {/* Tâches + Services */}
              <div className="grid sm:grid-cols-2 gap-4 mb-2">
                {/* Tâches */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2.5 flex items-center gap-1.5">
                    <Wrench className="w-3 h-3" /> Opérations
                  </p>
                  <div className="space-y-2">
                    {TASKS.map((t) => (
                      <div key={t.label} className="flex items-center gap-2.5">
                        {t.done ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : t.active ? (
                          <RefreshCw className="w-4 h-4 text-gold flex-shrink-0 animate-spin" />
                        ) : (
                          <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
                          </span>
                        )}
                        <p className={`text-xs leading-snug ${t.done ? "text-white/40 line-through" : t.active ? "text-white font-semibold" : "text-white/50"}`}>
                          {t.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2.5 flex items-center gap-1.5">
                    <Server className="w-3 h-3" /> État des services
                  </p>
                  <div className="space-y-2">
                    {SERVICES.map((s) => (
                      <div key={s.label} className="flex items-center gap-2.5">
                        <s.icon className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                        <p className="text-xs text-white/70 flex-1 min-w-0 truncate">{s.label}</p>
                        {s.state === "ok" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gold">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Maintenance
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bandeau accès privilégié (admin / enseignant / jury) */}
        {privileged && !lifted && (
          <div className="mt-4 bg-white/[0.04] backdrop-blur-xl border border-gold/20 rounded-2xl p-4 flex items-center gap-3 flex-wrap animate-fade-up">
            <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-sm font-bold text-white">Accès privilégié — {user!.roleLabel}</p>
              <p className="text-[11px] text-white/50">Vous pouvez continuer ou lever la maintenance pour tous.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard"
                className="text-xs font-bold text-white border border-white/20 hover:bg-white/10 px-4 py-2 rounded-full transition-colors">
                Continuer
              </Link>
              {user!.role === "admin" && (
                <button onClick={disableAndGo}
                  className="text-xs font-bold text-white bg-gold hover:bg-gold-dark px-4 py-2 rounded-full transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Lever la maintenance
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pied : support + bas-débit */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-white/40 text-[11px] animate-fade-up">
          <a href="mailto:support@jfn.cm" className="flex items-center gap-1.5 hover:text-white/70 transition-colors">
            <Mail className="w-3.5 h-3.5" /> support@jfn.cm
          </a>
          <a href="tel:+237600000000" className="flex items-center gap-1.5 hover:text-white/70 transition-colors">
            <Phone className="w-3.5 h-3.5" /> +237 6 00 00 00 00
          </a>
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" /> Page allégée pour le bas-débit
          </span>
        </div>

        <p className="text-center text-white/25 text-[10px] mt-6">
          © {new Date().getFullYear()} Institut JFN · Plateforme CAMA — maintenance planifiée
        </p>
      </div>
    </div>
  );
}
