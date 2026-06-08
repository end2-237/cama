"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Wifi,
  BookOpen,
  Play,
  Users,
  Award,
  TrendingUp,
} from "lucide-react";

const floatingCards = [
  {
    icon: ShieldCheck,
    label: "Examen sécurisé",
    sub: "Proctoring IA actif",
    color: "text-accent",
    bg: "bg-accent/10",
    position: "top-[18%] right-[8%]",
    delay: "0s",
  },
  {
    icon: Wifi,
    label: "Mode bas-débit",
    sub: "Version light activée",
    color: "text-warning",
    bg: "bg-warning/10",
    position: "top-[48%] right-[4%]",
    delay: "1.5s",
  },
  {
    icon: TrendingUp,
    label: "Progression",
    sub: "INF301 — 78%",
    color: "text-primary-400",
    bg: "bg-primary-400/10",
    position: "bottom-[20%] right-[10%]",
    delay: "3s",
  },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-hero flex items-center overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div className="animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
              <span className="text-white/90 text-sm font-medium">
                Institut JFN — Plateforme Officielle
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
              Votre parcours
              <br />
              académique,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-300">
                digitalisé
              </span>
              <br />
              & sécurisé.
            </h1>

            <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-xl">
              CAMA est la plateforme LMS native bas-débit de JFN. Cours, examens,
              suivi académique et proctoring IA — conçu pour les réalités du Cameroun.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/auth/register" className="btn-primary text-base px-8 py-4 rounded-2xl shadow-2xl shadow-primary-600/40">
                Accéder à la plateforme
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#features" className="btn-outline text-base px-8 py-4 rounded-2xl">
                <Play className="w-4 h-4 fill-white" />
                Découvrir les modules
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon: Users, value: "3 Écoles", label: "intégrées" },
                { icon: BookOpen, value: "LMD", label: "Licence · Master" },
                { icon: Award, value: "Certifié", label: "QR Code sécurisé" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white/70" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-none">{value}</p>
                    <p className="text-white/50 text-xs mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="relative hidden lg:block animate-fade-in">
            {/* Main dashboard card */}
            <div className="glass rounded-3xl p-6 shadow-2xl">
              {/* Header bar */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Dashboard Étudiant</p>
                  <p className="text-white font-semibold text-lg">Bonjour, Jean-Paul 👋</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-danger/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/80" />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "UE validées", value: "12", color: "text-accent" },
                  { label: "Crédits", value: "36", color: "text-warning" },
                  { label: "Moyenne", value: "14.2", color: "text-primary-300" },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Courses progress */}
              <div className="space-y-3 mb-5">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Mes cours en cours</p>
                {[
                  { name: "Algorithmique Avancée", code: "INF301", progress: 78, color: "bg-accent" },
                  { name: "Bases de Données", code: "INF302", progress: 55, color: "bg-primary-400" },
                  { name: "Réseaux Informatiques", code: "INF303", progress: 30, color: "bg-warning" },
                ].map((course) => (
                  <div key={course.code} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-white text-xs font-medium truncate">{course.name}</span>
                        <span className="text-white/50 text-xs ml-2">{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${course.color}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming exam */}
              <div className="glass-dark rounded-xl p-3 border-l-4 border-warning">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-warning flex-shrink-0" />
                  <div>
                    <p className="text-white text-xs font-semibold">Examen — Bases de Données</p>
                    <p className="text-white/50 text-xs">Lundi 10 juin · 09h00 · Salle virtuelle</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating micro-cards */}
            {floatingCards.map((card) => (
              <div
                key={card.label}
                className={`absolute ${card.position} glass rounded-2xl px-4 py-3 shadow-xl`}
                style={{ animation: `float 6s ease-in-out ${card.delay} infinite` }}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold whitespace-nowrap">{card.label}</p>
                    <p className="text-white/50 text-[10px]">{card.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 inset-x-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
