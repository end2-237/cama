"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Grid3x3, Search, ChevronDown, Globe, HelpCircle, Menu, X,
  ChevronRight, Users, Award, BookOpen, Briefcase,
  Monitor, BarChart2, FlaskConical, Calculator,
  Newspaper, ExternalLink, GraduationCap,
} from "lucide-react";

/* ─── Données du mega-menu ─── */
const goals = [
  { icon: BookOpen,      label: "Accéder aux cours",       sub: "Cours en libre accès" },
  { icon: Award,         label: "Obtenir une certification", sub: "LMD · Licence · Master" },
  { icon: GraduationCap, label: "Rejoindre une filière",    sub: "Inscription guidée" },
  { icon: Briefcase,     label: "Préparer sa carrière",     sub: "Ressources emploi" },
];

const domaines = [
  { icon: Monitor,      label: "Informatique",      color: "text-cama" },
  { icon: BarChart2,    label: "Gestion",           color: "text-gold-dark" },
  { icon: FlaskConical, label: "Sciences",          color: "text-cama" },
  { icon: Calculator,   label: "Mathématiques",     color: "text-gold-dark" },
  { icon: Users,        label: "Management",        color: "text-cama" },
];

const courses = [
  {
    img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&q=80",
    tag: "Cours · Présentiel & En ligne",
    title: "Introduction à la Programmation",
    desc: "Bases du développement logiciel en Python — aucun prérequis.",
    count: "3 241 inscrits",
  },
  {
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&q=80",
    tag: "Cours · En ligne",
    title: "Gestion de Projet & Management",
    desc: "Méthodes agiles, Gantt et pilotage d'équipe en contexte africain.",
    count: "1 879 inscrits",
  },
  {
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
    tag: "Cours · Mixte",
    title: "Mathématiques pour l'Ingénieur",
    desc: "Algèbre linéaire, analyse, probabilités — L1 à L3.",
    count: "2 104 inscrits",
  },
];

const usefulLinks = [
  { icon: Newspaper,    label: "Actualités JFN" },
  { icon: BookOpen,     label: "Bibliothèque numérique" },
  { icon: Award,        label: "Certifications & Diplômes" },
  { icon: ExternalLink, label: "Témoignages étudiants" },
];

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Filières",        href: "#filieres" },
  { label: "Modules",         href: "#modules" },
  { label: "Acteurs",         href: "#roles" },
];

/* ─── Composant ─── */
export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [exploreOpen, setExplore] = useState(false);
  const [activeGoal,  setGoal]    = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* Fermer sur clic extérieur */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExplore(false);
      }
    };
    if (exploreOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exploreOpen]);

  return (
    <header
      ref={panelRef}
      className={`fixed top-0 inset-x-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "border-b border-border"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 mr-4 flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-cama to-gold" />
            <div className="leading-tight">
              <span className="block text-ink text-[10px] font-semibold uppercase tracking-widest text-muted">Institut JFN</span>
              <span className="block text-ink text-lg font-bold leading-none tracking-tight">
                CA<span className="text-cama">MA</span>
              </span>
            </div>
          </Link>

          {/* Explorer pill */}
          <button
            onClick={() => setExplore(!exploreOpen)}
            className={`hidden md:flex items-center gap-2 border rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              exploreOpen
                ? "border-cama bg-cama text-white shadow-md shadow-cama/25"
                : "border-ink/30 text-ink hover:bg-surface hover:border-cama/50"
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            Explorer
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${exploreOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-sm items-center gap-2 bg-surface rounded-full px-4 py-2 border border-border focus-within:border-cama focus-within:ring-2 focus-within:ring-cama/10 transition-all">
            <Search className="w-4 h-4 text-subtle flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher cours, ressources..."
              className="bg-transparent text-sm text-ink placeholder-subtle outline-none w-full"
            />
          </div>

          <div className="flex-1" />

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-muted hover:text-ink transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 ml-4">
            <button className="p-2 text-muted hover:text-ink transition-colors">
              <Globe className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted hover:text-ink transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <Link href="/auth/login" className="border-2 border-ink text-ink font-bold text-sm px-5 py-2 rounded-full hover:bg-surface transition-colors">
              Connexion
            </Link>
          </div>

          <button className="md:hidden ml-auto p-2 text-ink" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ─── Mega-menu Explore ─── */}
      <div
        className={`absolute top-full inset-x-0 bg-white border-t border-border shadow-2xl transition-all duration-250 overflow-hidden ${
          exploreOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        style={{ transitionProperty: "opacity, transform" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[220px_1fr_280px] gap-0 py-0">

            {/* ── Colonne gauche : Objectifs + Domaines ── */}
            <div className="border-r border-border py-6 pr-6">

              <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Objectifs</p>
              <ul className="space-y-0.5 mb-6">
                {goals.map((g, i) => {
                  const Icon = g.icon;
                  return (
                    <li key={i}>
                      <button
                        onMouseEnter={() => setGoal(i)}
                        onClick={() => setGoal(i)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                          activeGoal === i
                            ? "bg-cama-50 text-cama"
                            : "hover:bg-surface text-ink"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${activeGoal === i ? "text-cama" : "text-muted"}`} />
                          <div>
                            <p className="text-sm font-medium leading-none">{g.label}</p>
                            <p className={`text-[11px] mt-0.5 ${activeGoal === i ? "text-cama/70" : "text-subtle"}`}>{g.sub}</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeGoal === i ? "translate-x-0.5 text-cama" : "text-subtle"}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Domaines</p>
              <ul className="space-y-0.5 mb-6">
                {domaines.map((d, i) => {
                  const Icon = d.icon;
                  return (
                    <li key={i}>
                      <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-surface transition-all group">
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${d.color}`} />
                          <span className="text-sm text-ink font-medium">{d.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-subtle group-hover:text-ink transition-colors" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button className="w-full btn-primary py-2.5 text-sm rounded-xl justify-center">
                Voir tout le catalogue
              </button>
            </div>

            {/* ── Colonne centrale : Cours ── */}
            <div className="py-6 px-6 border-r border-border">
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-4">
                {goals[activeGoal].label}
              </p>

              <div className="space-y-2">
                {courses.map((c, i) => (
                  <button
                    key={i}
                    className="w-full flex gap-4 p-3 rounded-2xl hover:bg-surface transition-all duration-150 text-left group hover:shadow-sm border border-transparent hover:border-border"
                  >
                    <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-subtle mb-0.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {c.tag}
                      </p>
                      <p className="text-sm font-bold text-ink leading-snug mb-1 group-hover:text-cama transition-colors">
                        {c.title}
                      </p>
                      <p className="text-xs text-muted leading-snug line-clamp-2">{c.desc}</p>
                      <p className="text-[10px] text-subtle mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.count}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Colonne droite : Quoi de neuf + Liens utiles ── */}
            <div className="py-6 pl-6">

              {/* What's new */}
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Quoi de neuf</p>
              <div className="rounded-2xl overflow-hidden border border-border mb-2">
                <img
                  src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=400&q=80"
                  alt="Nouveauté CAMA"
                  className="w-full h-28 object-cover"
                />
                <div className="p-3">
                  <p className="text-sm font-bold text-ink leading-snug mb-1">
                    Examens sécurisés par IA — Rentrée 2025
                  </p>
                  <p className="text-xs text-muted leading-relaxed mb-2">
                    Le nouveau moteur de proctoring CAMA détecte les fraudes en temps réel grâce à YOLOv8.
                  </p>
                  <span className="text-xs font-bold text-cama hover:underline cursor-pointer">
                    En savoir plus →
                  </span>
                </div>
              </div>

              {/* Liens utiles */}
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-5 mb-3">Liens utiles</p>
              <ul className="space-y-0.5">
                {usefulLinks.map((l, i) => {
                  const Icon = l.icon;
                  return (
                    <li key={i}>
                      <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface transition-all group text-left">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 group-hover:bg-cama-50 transition-colors">
                            <Icon className="w-3.5 h-3.5 text-muted group-hover:text-cama transition-colors" />
                          </div>
                          <span className="text-sm text-ink">{l.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-subtle group-hover:text-ink transition-colors" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-border px-4 pb-4 pt-2 flex flex-col gap-1">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="py-3 text-sm font-medium text-muted border-b border-border last:border-0">
              {l.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/auth/login"    className="btn-outline text-center">Connexion</Link>
            <Link href="/auth/register" className="btn-primary text-center">Commencer</Link>
          </div>
        </div>
      )}
    </header>
  );
}
