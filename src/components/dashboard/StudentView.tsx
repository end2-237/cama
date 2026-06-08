"use client";

import { useState } from "react";
import {
  Search, LayoutGrid, List, BookOpen, Clock, Award,
  ChevronRight, Play, MoreVertical, Calendar, CheckCircle2,
  Star, TrendingUp,
} from "lucide-react";

const courses = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80",
    badge: "L2",
    badgeColor: "bg-cama text-white",
    school: "École d'Informatique",
    type: "Cours · Présentiel & En ligne",
    title: "Algorithmique et Structures de Données",
    desc: "Maîtriser les algorithmes fondamentaux — tri, recherche, graphes.",
    progress: 68,
    lastSeen: "Il y a 2h",
    chapters: 12,
    doneChapters: 8,
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
    badge: "L2",
    badgeColor: "bg-gold text-white",
    school: "École de Gestion",
    type: "Cours · En ligne",
    title: "Comptabilité Générale & Analytique",
    desc: "Plan comptable OHADA, bilan, compte de résultat et analyse financière.",
    progress: 35,
    lastSeen: "Hier",
    chapters: 10,
    doneChapters: 3,
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
    badge: "L2",
    badgeColor: "bg-cama text-white",
    school: "École des Sciences",
    type: "Cours · Mixte",
    title: "Analyse Mathématique II",
    desc: "Séries, intégrales multiples, équations différentielles.",
    progress: 82,
    lastSeen: "Il y a 3 jours",
    chapters: 9,
    doneChapters: 7,
  },
];

const achievements = [
  {
    icon: "🏆",
    bg: "bg-gold/10",
    label: "Algorithmique — Chapitre 5",
    sub: "Cours · École d'Informatique",
    date: "Aujourd'hui",
  },
  {
    icon: "⭐",
    bg: "bg-cama-50",
    label: "Quiz Comptabilité — 18/20",
    sub: "Examen · École de Gestion",
    date: "Hier",
  },
  {
    icon: "🎓",
    bg: "bg-green-50",
    label: "Certificat Analyse I validé",
    sub: "Diplôme · École des Sciences",
    date: "Il y a 5 jours",
  },
];

const upcoming = [
  {
    icon: "📝",
    title: "Examen INF302",
    sub: "Algorithmique · Salle B204",
    date: "Lundi 10 juin · 08h00",
    urgent: true,
  },
  {
    icon: "📚",
    title: "Rendu TP Comptabilité",
    sub: "Bilan exercice 2024",
    date: "Mercredi 12 juin · 23h59",
    urgent: false,
  },
];

export default function StudentView() {
  const [view,   setView]   = useState<"grid"|"list">("grid");
  const [search, setSearch] = useState("");

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

      {/* ── Contenu principal ── */}
      <div>
        {/* Titre */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-7 h-7 text-ink" strokeWidth={1.5} />
          <h1 className="text-3xl font-light text-ink">Mes Cours</h1>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: TrendingUp, label: "Progression moy.", value: "62%",  color: "text-cama",     bg: "bg-cama-50" },
            { icon: CheckCircle2, label: "Cours terminés", value: "4",    color: "text-green-600", bg: "bg-green-50" },
            { icon: Star,         label: "Moy. générale",  value: "14.8", color: "text-gold-dark", bg: "bg-gold/10" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* En cours */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">En cours</h2>
          <button className="text-xs text-cama hover:underline font-medium">Voir tout</button>
        </div>

        {/* Barre filtres */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 bg-surface rounded-full px-4 py-2 border border-border flex-1 min-w-[180px] max-w-xs focus-within:border-cama focus-within:ring-2 focus-within:ring-cama/10 transition-all">
            <Search className="w-4 h-4 text-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un cours..."
              className="bg-transparent text-sm outline-none w-full text-ink placeholder-subtle"
            />
          </div>

          <select className="border border-border rounded-full px-4 py-2 text-sm text-ink bg-white outline-none focus:border-cama transition-all cursor-pointer">
            <option>École : Toutes</option>
            <option>Informatique</option>
            <option>Gestion</option>
            <option>Sciences</option>
          </select>

          <select className="border border-border rounded-full px-4 py-2 text-sm text-ink bg-white outline-none focus:border-cama transition-all cursor-pointer">
            <option>Type : Tous</option>
            <option>Cours</option>
            <option>Examen</option>
            <option>TP</option>
          </select>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-cama text-white" : "text-muted hover:bg-surface"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-cama text-white" : "text-muted hover:bg-surface"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grille de cours */}
        {view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-cama/20 transition-all duration-200 group cursor-pointer">
                {/* Image */}
                <div className="relative h-36 overflow-hidden">
                  <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badgeColor}`}>
                    {c.badge}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-cama fill-cama ml-0.5" />
                    </div>
                  </div>
                  <button className="absolute top-2 right-2 p-1 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <p className="text-[10px] text-subtle mb-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {c.type}
                  </p>
                  <p className="text-xs font-semibold text-muted mb-1">{c.school}</p>
                  <h3 className="text-sm font-bold text-ink leading-snug mb-2 group-hover:text-cama transition-colors line-clamp-2">
                    {c.title}
                  </h3>

                  {/* Progression */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                      <span>{c.doneChapters}/{c.chapters} chapitres</span>
                      <span className="font-bold text-cama">{c.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cama to-cama-400 rounded-full transition-all duration-700"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-subtle">
                    <Clock className="w-3 h-3" /> {c.lastSeen}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vue liste */
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-border p-4 flex gap-4 hover:shadow-md hover:border-cama/20 transition-all duration-200 group cursor-pointer">
                <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-subtle mb-0.5">{c.type} · {c.school}</p>
                      <h3 className="text-sm font-bold text-ink group-hover:text-cama transition-colors">{c.title}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${c.badgeColor}`}>{c.badge}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden max-w-[200px]">
                      <div className="h-full bg-gradient-to-r from-cama to-cama-400 rounded-full" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="text-xs font-bold text-cama">{c.progress}%</span>
                    <span className="text-[10px] text-subtle flex items-center gap-1"><Clock className="w-3 h-3" />{c.lastSeen}</span>
                  </div>
                </div>
                <button className="flex-shrink-0 self-center p-2 rounded-full bg-cama text-white hover:bg-cama-700 transition-colors opacity-0 group-hover:opacity-100">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sidebar droite ── */}
      <div className="space-y-6">

        {/* Dernières réussites */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">Dernières réussites</h2>
            <button className="text-xs text-cama hover:underline font-medium">Tout voir</button>
          </div>
          <div className="space-y-3">
            {achievements.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className={`w-11 h-11 rounded-full ${a.bg} flex items-center justify-center text-xl flex-shrink-0 border-2 border-white shadow-sm`}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Réussite</p>
                  <p className="text-sm font-semibold text-ink leading-snug line-clamp-1">{a.label}</p>
                  <p className="text-[10px] text-subtle flex items-center gap-1 mt-0.5">
                    <BookOpen className="w-3 h-3" /> {a.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prochains devoirs */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">Prochains devoirs</h2>
            <button className="text-xs text-cama hover:underline font-medium">Tout voir</button>
          </div>
          <div className="space-y-3">
            {upcoming.map((u, i) => (
              <div key={i} className={`flex gap-3 items-start p-3 rounded-xl border transition-all ${u.urgent ? "border-red-100 bg-red-50/50" : "border-border bg-surface"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${u.urgent ? "bg-red-100" : "bg-white border border-border"}`}>
                  {u.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold leading-snug ${u.urgent ? "text-red-700" : "text-ink"}`}>{u.title}</p>
                  <p className="text-[10px] text-muted">{u.sub}</p>
                  <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${u.urgent ? "text-red-500" : "text-subtle"}`}>
                    <Calendar className="w-3 h-3" /> {u.date}
                  </p>
                </div>
              </div>
            ))}
            <div className="text-center py-4 text-muted">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Aucun autre devoir prévu</p>
            </div>
          </div>
        </div>

        {/* CTA inscription cours */}
        <div className="rounded-2xl overflow-hidden border border-cama/20"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
          <div className="p-5">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Nouveau</p>
            <p className="text-white font-bold text-sm leading-snug mb-3">
              Explorer 12 filières disponibles pour la rentrée 2025
            </p>
            <button className="flex items-center gap-1 text-gold text-xs font-bold hover:underline">
              Voir les filières <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
