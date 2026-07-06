"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Wifi, Terminal, QrCode } from "lucide-react";

const MARQUEE = [
  "Informatique", "Génie Logiciel", "Réseaux & Télécom", "Intelligence Artificielle",
  "Gestion & Finance", "Management", "Mathématiques", "Sciences Biologiques",
  "Lettres & SHS", "Relations Internationales", "Bases de Données", "Chimie & Sciences",
];

const PROOFS = [
  { icon: ShieldCheck, label: "Examens surveillés par IA" },
  { icon: Terminal,    label: "TP sur machines Linux réelles" },
  { icon: Wifi,        label: "Pensé pour le bas-débit" },
  { icon: QrCode,      label: "Diplômes vérifiables par QR" },
];

export default function Hero() {
  const [y, setY] = useState(0);
  const raf = useRef(0);

  // Parallax léger du fond vidéo au scroll (désactivé si reduced-motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => setY(Math.min(window.scrollY, 900)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <section className="relative overflow-hidden bg-cama-900 -mt-16">
      {/* ── Fond vidéo + parallax ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `translateY(${y * 0.28}px)` }}
        aria-hidden
      >
        <video
          className="w-full h-full object-cover animate-ken-burns"
          src="https://videos.pexels.com/video-files/3252125/3252125-hd_1920_1080_25fps.mp4"
          poster="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=70"
          autoPlay muted loop playsInline
        />
        {/* Voiles : lisibilité + signature indigo CAMA */}
        <div className="absolute inset-0 bg-cama-900/72" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, #1E1B4B 0%, rgba(30,27,75,0.82) 38%, rgba(30,27,75,0.25) 75%, rgba(30,27,75,0.55) 100%)" }} />
        <div className="absolute inset-0 kente-pattern opacity-[0.12]" />
      </div>

      {/* ── Contenu ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32 pb-10 flex flex-col"
        style={{ minHeight: "100vh" }}>

        <div className="grid lg:grid-cols-12 gap-10 items-center flex-1">

          {/* Colonne texte — éditoriale */}
          <div className="lg:col-span-7">
            {/* Sur-titre institutionnel */}
            <div className="hero-mask mb-5">
              <span className="hero-line inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-gold">
                <span className="w-10 h-px bg-gold inline-block" />
                Institut JFN · Cameroun · Rentrée 2024–2025
              </span>
            </div>

            {/* Titre — lignes masquées qui montent */}
            <h1 className="font-extrabold text-white tracking-tight leading-[0.98]"
              style={{ fontSize: "clamp(2.6rem, 6.2vw, 5rem)" }}>
              <span className="hero-mask"><span className="hero-line" style={{ animationDelay: "80ms" }}>Étudier ici.</span></span>
              <span className="hero-mask">
                <span className="hero-line" style={{ animationDelay: "200ms" }}>
                  Réussir{" "}
                  <span className="relative inline-block text-gold">
                    partout.
                    <span className="animate-draw-x absolute -bottom-1.5 left-0 right-0 h-1.5 bg-gold" style={{ animationDelay: "900ms" }} />
                  </span>
                </span>
              </span>
            </h1>

            <div className="hero-mask mt-6">
              <p className="hero-line max-w-xl text-base sm:text-lg text-white/75 leading-relaxed" style={{ animationDelay: "340ms" }}>
                CAMA est le campus numérique de l&apos;Institut JFN : cours, examens
                surveillés par IA, travaux pratiques sur machines réelles et diplômes
                vérifiables — conçu pour les réalités du Cameroun.
              </p>
            </div>

            {/* CTA */}
            <div className="hero-mask mt-8">
              <div className="hero-line flex flex-wrap items-center gap-4" style={{ animationDelay: "460ms" }}>
                <Link href="/auth/register" className="btn-gold gap-2 text-sm px-8 py-4">
                  Commencer maintenant <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#filieres" className="btn-outline-white text-sm px-8 py-4">
                  Explorer les filières
                </Link>
              </div>
            </div>

            {/* Preuves — remplace les pills génériques */}
            <div className="hero-mask mt-10">
              <div className="hero-line grid grid-cols-2 sm:flex sm:flex-wrap gap-x-8 gap-y-3" style={{ animationDelay: "580ms" }}>
                {PROOFS.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-2 text-[12px] font-semibold text-white/70">
                    <Icon className="w-4 h-4 text-gold flex-shrink-0" strokeWidth={2} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne HUD — fenêtre live sur la plateforme */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="hero-mask">
              <div className="hero-line space-y-3" style={{ animationDelay: "520ms" }}>

                {/* Carte examen en direct */}
                <div className="bg-white/[0.07] backdrop-blur-md border border-white/15 p-5"
                  style={{ transform: `translateY(${y * -0.06}px)` }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">En direct sur CAMA</p>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-gold">
                      <span className="w-1.5 h-1.5 bg-gold animate-pulse" /> LIVE
                    </span>
                  </div>
                  <p className="text-white font-bold text-sm mb-1">Examen INF302 · Structures de données</p>
                  <p className="text-white/50 text-xs mb-3">47 étudiants · surveillance caméra active</p>
                  <div className="w-full h-1 bg-white/10 overflow-hidden">
                    <div className="h-full w-[72%] bg-gradient-to-r from-cama-400 to-gold" />
                  </div>
                  <p className="text-[10px] text-white/40 mt-1.5">72% du temps écoulé · sauvegarde auto toutes les 15 s</p>
                </div>

                {/* Carte TP machine */}
                <div className="bg-white/[0.07] backdrop-blur-md border border-white/15 p-5"
                  style={{ transform: `translateY(${y * -0.12}px)` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">TP · Machine Linux</p>
                  <div className="bg-cama-900/80 border border-white/10 p-3 font-mono text-[11px] leading-relaxed">
                    <p className="text-white/40">student@tp-cama:~$ <span className="text-white">gcc projet.c -o projet</span></p>
                    <p className="text-white/40">student@tp-cama:~$ <span className="text-white">./projet</span></p>
                    <p className="text-gold">✓ Compilation réussie — 0 erreur</p>
                  </div>
                </div>

                {/* Carte résultat certifié */}
                <div className="bg-white/[0.07] backdrop-blur-md border border-white/15 p-5 flex items-center gap-4"
                  style={{ transform: `translateY(${y * -0.18}px)` }}>
                  <div className="w-11 h-11 bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">Relevé certifié · L3 Génie Logiciel</p>
                    <p className="text-white/50 text-xs">Vérifiable en ligne · code CAMA-8F42</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Indicateur de scroll */}
        <div className="hidden sm:flex justify-center pt-8 pb-2">
          <div className="w-6 h-10 border-2 border-white/25 rounded-full flex justify-center pt-2">
            <span className="w-1 h-2 bg-gold rounded-full animate-scroll-dot" />
          </div>
        </div>
      </div>

      {/* ── Bandeau filières défilant ── */}
      <div className="relative border-t border-white/10 bg-cama-900/60 backdrop-blur-sm py-4 overflow-hidden">
        <div className="marquee-track" aria-hidden>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center flex-shrink-0">
              {MARQUEE.map((f) => (
                <span key={`${copy}-${f}`} className="flex items-center text-[12px] font-bold uppercase tracking-[0.18em] text-white/55 whitespace-nowrap">
                  <span className="px-6">{f}</span>
                  <span className="w-1.5 h-1.5 rotate-45 bg-gold/70 flex-shrink-0" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
