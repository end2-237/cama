"use client";

import {
  BookOpen, Users, CheckSquare, Clock, TrendingUp,
  PlusCircle, MoreVertical, Eye, Edit3, ChevronRight,
  AlertCircle, Star,
} from "lucide-react";

const myCourses = [
  {
    img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80",
    title: "Algorithmique et Structures de Données",
    school: "École d'Informatique · L2",
    students: 47,
    avgProgress: 64,
    pendingWork: 5,
    status: "Actif",
    statusColor: "bg-green-100 text-green-700",
  },
  {
    img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
    title: "Mathématiques pour l'Ingénieur",
    school: "École des Sciences · L1",
    students: 31,
    avgProgress: 41,
    pendingWork: 12,
    status: "Actif",
    statusColor: "bg-green-100 text-green-700",
  },
  {
    img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80",
    title: "Initiation à la Recherche",
    school: "École d'Informatique · M1",
    students: 18,
    avgProgress: 88,
    pendingWork: 0,
    status: "Terminé",
    statusColor: "bg-surface text-muted",
  },
];

const toCorrect = [
  { title: "TP Tri rapide", course: "Algorithmique L2", count: 5, urgent: true },
  { title: "Examen partiel S2", course: "Maths L1", count: 12, urgent: true },
  { title: "Rapport de recherche", course: "Initiation M1", count: 2, urgent: false },
];

const recentActivity = [
  { avatar: "NM", name: "Nadia Mbeki",    action: "a terminé le chapitre 8",    time: "Il y a 30 min" },
  { avatar: "JP", name: "Jean-Paul Fomo", action: "a soumis le TP Tri rapide",  time: "Il y a 2h" },
  { avatar: "SA", name: "Sarah Ateba",    action: "a posé une question (forum)", time: "Hier" },
];

export default function TeacherView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

      {/* ── Principal ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-ink" strokeWidth={1.5} />
            <h1 className="text-3xl font-light text-ink">Mes Cours</h1>
          </div>
          <button className="btn-primary gap-2 py-2.5 px-5 text-sm rounded-xl">
            <PlusCircle className="w-4 h-4" /> Nouveau cours
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users,       label: "Étudiants totaux", value: "96",   color: "text-cama",     bg: "bg-cama-50" },
            { icon: CheckSquare, label: "Travaux à corriger", value: "19", color: "text-red-500",   bg: "bg-red-50" },
            { icon: Star,        label: "Note moy. donnée",  value: "13.4",color: "text-gold-dark", bg: "bg-gold/10" },
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

        <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Mes cours créés</h2>

        <div className="space-y-4">
          {myCourses.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-cama/20 transition-all duration-200 group">
              <div className="flex gap-0">
                <div className="w-32 h-28 flex-shrink-0 overflow-hidden">
                  <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-xs text-muted mb-0.5">{c.school}</p>
                      <h3 className="text-sm font-bold text-ink group-hover:text-cama transition-colors">{c.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.statusColor}`}>{c.status}</span>
                      <button className="p-1 text-subtle hover:text-ink rounded-lg hover:bg-surface transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.students} étudiants</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {c.avgProgress}% moy.</span>
                    {c.pendingWork > 0 && (
                      <span className="flex items-center gap-1 text-red-500 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> {c.pendingWork} à corriger
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button className="flex items-center gap-1 text-xs text-cama border border-cama/30 rounded-lg px-3 py-1.5 hover:bg-cama-50 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Aperçu
                    </button>
                    <button className="flex items-center gap-1 text-xs text-ink border border-border rounded-lg px-3 py-1.5 hover:bg-surface transition-colors">
                      <Edit3 className="w-3.5 h-3.5" /> Modifier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className="space-y-6">

        {/* À corriger */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">À corriger</h2>
            <button className="text-xs text-cama hover:underline font-medium">Tout voir</button>
          </div>
          <div className="space-y-3">
            {toCorrect.map((t, i) => (
              <button key={i} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all hover:shadow-sm group ${t.urgent ? "border-red-100 bg-red-50/50 hover:border-red-200" : "border-border hover:border-cama/20"}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${t.urgent ? "bg-red-100 text-red-600" : "bg-surface text-muted"}`}>
                  {t.count}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-none ${t.urgent ? "text-red-700" : "text-ink"}`}>{t.title}</p>
                  <p className="text-[10px] text-muted mt-0.5">{t.course}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-subtle group-hover:text-ink transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">Activité récente</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cama-50 flex items-center justify-center text-cama text-[10px] font-bold flex-shrink-0">
                  {a.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink leading-snug">
                    <span className="font-semibold">{a.name}</span> {a.action}
                  </p>
                  <p className="text-[10px] text-subtle flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {a.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
