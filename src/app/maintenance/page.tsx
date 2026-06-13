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

const TASKS = [
  { label: "Migration base de données", done: true },
  { label: "Mise à jour Safe-CAMA", done: true },
  { label: "Optimisation CDN bas-débit", done: false, active: true },
  { label: "Redémarrage des services", done: false },
];

const SERVICES = [
  { icon: Server, label: "Serveur applicatif", ok: false },
  { icon: Database, label: "Base de données", ok: true },
  { icon: Bot, label: "Service Prof IA", ok: true },
  { icon: Wifi, label: "Passerelle SMS / USSD", ok: true },
];

function fmt(ms: number) {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export default function MaintenancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const maint = useMaintenance();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const privileged = !!user && user.role !== "etudiant";
  const remaining = maint.until ? fmt(maint.until - now) : null;
  const progress = maint.since && maint.until
    ? Math.min(100, Math.max(4, Math.round(((now - maint.since) / (maint.until - maint.since)) * 100)))
    : 64;
  const lifted = !maint.on;

  const disableAndGo = () => { setMaintenance(false); router.push("/dashboard"); };

  return (
    <div className="h-[100dvh] overflow-hidden relative flex flex-col items-center justify-center px-4 py-4"
      style={{ background: "linear-gradient(160deg, #1E1B4B 0%, #2D2A6E 50%, #1a1640 100%)" }}>

      {/* Décor */}
      <div className="absolute inset-0 kente-pattern opacity-20" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cama-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-gold/10 blur-3xl" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice" fill="none">
        <g className="animate-float-slow" style={{ transformOrigin: "120px 160px" }}>
          <circle cx="120" cy="160" r="16" fill="#818CF8" opacity="0.55" />
          <circle cx="120" cy="160" r="26" fill="none" stroke="#818CF8" strokeWidth="1.5" opacity="0.22" />
        </g>
        <g className="animate-float-med" style={{ transformOrigin: "880px 120px" }}>
          <rect x="856" y="96" width="46" height="46" rx="4" fill="#F59E0B" opacity="0.6" transform="rotate(45 880 120)" />
        </g>
        <g className="animate-float-fast" style={{ transformOrigin: "905px 650px" }}>
          <polygon points="875,700 905,640 935,700" fill="#F59E0B" opacity="0.4" />
        </g>
        <g className="animate-drift" style={{ transformOrigin: "90px 660px" }}>
          <path d="M60 640 L90 623 L120 640 L120 674 L90 691 L60 674 Z" fill="#A5B4FC" opacity="0.4" />
        </g>
      </svg>

      <div className="relative w-full max-w-3xl">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-cama-400 to-gold" />
          <div className="leading-tight text-left">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-white/50">Institut JFN</span>
            <span className="block text-xl font-bold leading-none text-white tracking-tight">CA<span className="text-gold">MA</span></span>
          </div>
        </div>

        {/* Carte */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-7 animate-scale-in shadow-2xl">

          {lifted ? (
            /* Service rétabli */
            <div className="text-center py-2">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <CheckCircle2 className="w-14 h-14 text-green-400" strokeWidth={1.4} />
              </div>
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-300 bg-green-500/15 border border-green-400/20 px-3 py-1 rounded-full mb-3">
                Service rétabli
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">La plateforme est de retour</h1>
              <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto mb-6">
                La maintenance est terminée. Merci de votre patience — vous pouvez reprendre votre parcours sur CAMA.
              </p>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-white font-bold text-sm px-7 py-3 rounded-full transition-all active:scale-95">
                Accéder à mon tableau de bord <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* En cours — 2 colonnes sur desktop */
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-7 items-center">

              {/* Col gauche : message */}
              <div className="text-center sm:text-left">
                <div className="relative w-14 h-14 mx-auto sm:mx-0 mb-4">
                  <Settings className="absolute inset-0 w-14 h-14 text-cama-300/90" strokeWidth={1.2} style={{ animation: "spin 9s linear infinite" }} />
                  <Wrench className="absolute -bottom-1 -right-1 w-7 h-7 text-gold bg-cama-900 rounded-full p-1.5 border border-white/10" style={{ animation: "spin 6s linear infinite reverse" }} />
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold bg-gold/10 border border-gold/20 px-3 py-1 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Maintenance en cours
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
                  Nous améliorons <span className="text-gold">CAMA</span>
                </h1>
                <p className="text-white/60 text-[13px] leading-relaxed">
                  Plateforme momentanément indisponible pour une maintenance planifiée. Vos données et votre progression sont en sécurité.
                </p>
              </div>

              {/* Col droite : compte à rebours + suivi */}
              <div>
                {/* Compte à rebours */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 text-center mb-2.5 flex items-center justify-center gap-1.5">
                    <Clock className="w-3 h-3" /> Retour estimé
                  </p>
                  {remaining ? (
                    <div className="flex items-center justify-center gap-2">
                      {[{ v: remaining.h, l: "h" }, { v: remaining.m, l: "min" }, { v: remaining.s, l: "s" }].map((u, i) => (
                        <div key={u.l} className="flex items-center gap-2">
                          <div className="text-center">
                            <div className="w-14 bg-cama-900/60 border border-white/10 rounded-lg py-2">
                              <span className="text-2xl font-black text-white tabular-nums">{String(u.v).padStart(2, "0")}</span>
                            </div>
                            <p className="text-[8px] text-white/40 mt-1 uppercase tracking-wider">{u.l}</p>
                          </div>
                          {i < 2 && <span className="text-xl font-black text-white/25 -mt-4">:</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-base font-bold text-gold flex items-center justify-center gap-2 py-1">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Finalisation…
                    </p>
                  )}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[9px] text-white/40 mb-1">
                      <span>Progression</span><span className="font-bold text-white/70">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-cama-900/60 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cama-400 to-gold rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                {/* Opérations + services */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Opérations</p>
                    <div className="space-y-1">
                      {TASKS.map((t) => (
                        <div key={t.label} className="flex items-center gap-1.5">
                          {t.done ? <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                            : t.active ? <RefreshCw className="w-3 h-3 text-gold flex-shrink-0 animate-spin" />
                            : <span className="w-3 h-3 flex-shrink-0 flex items-center justify-center"><span className="w-1 h-1 rounded-full bg-white/25" /></span>}
                          <p className={`text-[10px] leading-tight ${t.done ? "text-white/35 line-through" : t.active ? "text-white font-semibold" : "text-white/45"}`}>{t.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Services</p>
                    <div className="space-y-1">
                      {SERVICES.map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <s.icon className="w-3 h-3 text-white/40 flex-shrink-0" />
                          <p className="text-[10px] text-white/70 flex-1 min-w-0 truncate leading-tight">{s.label}</p>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.ok ? "bg-green-400" : "bg-gold animate-pulse"}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bandeau accès privilégié */}
        {privileged && !lifted && (
          <div className="mt-3 bg-white/[0.04] backdrop-blur-xl border border-gold/20 rounded-xl px-4 py-2.5 flex items-center gap-3 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-gold flex-shrink-0" />
            <p className="text-xs font-semibold text-white flex-1 min-w-[150px]">
              Accès privilégié — {user!.roleLabel}
              <span className="text-white/40 font-normal"> · vous pouvez continuer ou lever la maintenance</span>
            </p>
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="text-[11px] font-bold text-white border border-white/20 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">Continuer</Link>
              {user!.role === "admin" && (
                <button onClick={disableAndGo} className="text-[11px] font-bold text-white bg-gold hover:bg-gold-dark px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Lever la maintenance
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pied compact */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-white/40 text-[11px]">
          <a href="mailto:support@jfn.cm" className="flex items-center gap-1.5 hover:text-white/70 transition-colors"><Mail className="w-3.5 h-3.5" /> support@jfn.cm</a>
          <a href="tel:+237600000000" className="flex items-center gap-1.5 hover:text-white/70 transition-colors"><Phone className="w-3.5 h-3.5" /> +237 6 00 00 00 00</a>
          <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> Page allégée bas-débit</span>
          <span className="text-white/25">· © {new Date().getFullYear()} Institut JFN</span>
        </div>
      </div>
    </div>
  );
}
