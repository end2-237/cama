"use client";

import {
  Users, BookOpen, GraduationCap, ShieldCheck,
  TrendingUp, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, UserPlus, Settings, BarChart2,
  Activity,
} from "lucide-react";

const globalStats = [
  { icon: Users,         label: "Étudiants actifs",  value: "1 247", delta: "+38 ce mois",  color: "text-cama",      bg: "bg-cama-50" },
  { icon: GraduationCap, label: "Enseignants",        value: "34",    delta: "+2 ce mois",   color: "text-gold-dark", bg: "bg-gold/10" },
  { icon: BookOpen,      label: "Cours publiés",      value: "89",    delta: "+5 ce mois",   color: "text-cama",      bg: "bg-cama-50" },
  { icon: BarChart2,     label: "Examens planifiés",  value: "12",    delta: "7 cette semaine",color: "text-green-600",bg: "bg-green-50" },
];

const recentUsers = [
  { initials: "OM", name: "Oumarou Moussa",     role: "Étudiant",    school: "École d'Informatique", date: "Aujourd'hui · 09:12", color: "bg-cama text-white" },
  { initials: "CB", name: "Carine Beyala",      role: "Étudiant",    school: "École de Gestion",     date: "Aujourd'hui · 08:47", color: "bg-gold text-white" },
  { initials: "PD", name: "Prof. David Nkolo",  role: "Enseignant",  school: "École des Sciences",   date: "Hier · 16:30",        color: "bg-cama-700 text-white" },
  { initials: "FS", name: "Fatou Sall",         role: "Étudiant",    school: "École de Gestion",     date: "Hier · 14:12",        color: "bg-gold-dark text-white" },
];

const alerts = [
  { icon: AlertTriangle, text: "5 examens sans surveillance assignée",  color: "text-amber-600", bg: "bg-amber-50 border-amber-100", urgent: true },
  { icon: ShieldCheck,   text: "Mise à jour du module proctoring IA",    color: "text-cama",     bg: "bg-cama-50 border-cama/20",    urgent: false },
  { icon: CheckCircle2,  text: "Backup base de données — OK (03:00)",    color: "text-green-600",bg: "bg-green-50 border-green-100", urgent: false },
];

const quickActions = [
  { icon: UserPlus,  label: "Ajouter un utilisateur",  color: "bg-cama-50 text-cama" },
  { icon: BookOpen,  label: "Publier un cours",          color: "bg-gold/10 text-gold-dark" },
  { icon: Settings,  label: "Paramètres plateforme",    color: "bg-surface text-muted" },
  { icon: Activity,  label: "Logs & Audit",             color: "bg-surface text-muted" },
];

export default function AdminView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

      {/* ── Principal ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-7 h-7 text-ink" strokeWidth={1.5} />
          <h1 className="text-3xl font-light text-ink">Tableau de bord</h1>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {globalStats.map(({ icon: Icon, label, value, delta, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-4 hover:shadow-md hover:border-cama/20 transition-all">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs font-medium text-ink mt-0.5">{label}</p>
              <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" /> {delta}
              </p>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {quickActions.map(({ icon: Icon, label, color }) => (
            <button key={label} className="bg-white rounded-2xl border border-border p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-cama/20 transition-all text-center group">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-ink leading-snug">{label}</p>
            </button>
          ))}
        </div>

        {/* Utilisateurs récents */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Inscriptions récentes</h2>
          <button className="text-xs text-cama hover:underline font-medium">Gérer les utilisateurs</button>
        </div>
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-5 py-3">Utilisateur</th>
                <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-5 py-3 hidden sm:table-cell">Rôle</th>
                <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-5 py-3 hidden md:table-cell">École</th>
                <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-5 py-3">Inscription</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${u.color} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                        {u.initials}
                      </div>
                      <p className="text-sm font-semibold text-ink">{u.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.role === "Enseignant" ? "bg-gold/10 text-gold-dark" : "bg-cama-50 text-cama"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="text-xs text-muted">{u.school}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-[10px] text-subtle flex items-center gap-1"><Clock className="w-3 h-3" />{u.date}</p>
                  </td>
                  <td className="px-5 py-3">
                    <button className="text-subtle hover:text-cama transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className="space-y-6">

        {/* Alertes système */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">Alertes système</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">1 urgente</span>
          </div>
          <div className="space-y-2">
            {alerts.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${a.bg} transition-all`}>
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.color}`} />
                  <p className="text-xs text-ink leading-snug">{a.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Utilisation plateforme */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="text-sm font-bold text-ink mb-4">Utilisation</h2>
          <div className="space-y-3">
            {[
              { label: "Connexions aujourd'hui", value: 234, max: 400, color: "bg-cama" },
              { label: "Examens actifs",          value: 3,   max: 10,  color: "bg-gold" },
              { label: "Stockage utilisé",        value: 68,  max: 100, color: "bg-green-500" },
            ].map(({ label, value, max, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted">{label}</span>
                  <span className="font-bold text-ink">{value}<span className="text-subtle font-normal">/{max}</span></span>
                </div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
