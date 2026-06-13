"use client";

import { useEffect, useState } from "react";
import { getMaintenance, setMaintenance } from "@/lib/maintenance";
import {
  Users, BookOpen, GraduationCap, ShieldCheck, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, ChevronRight, UserPlus, Settings, BarChart2,
  Activity, Server, Database, Radio, Megaphone, FileText, Search,
  Wifi, HardDrive, Lock, Gavel, Building2, Zap, Bot,
  Terminal, Filter, MoreVertical, Check, ToggleRight, ToggleLeft, Globe,
} from "lucide-react";

export default function AdminView({ tab }: { tab: string }) {
  if (tab === "Utilisateurs") return <UsersTab />;
  if (tab === "Paramètres")   return <SettingsTab />;
  return <OverviewTab />;
}

/* ════════════════════════════════════════════════════════════
   CONSOLE SYSTÈME — flux d'activité temps réel (colonne gauche)
════════════════════════════════════════════════════════════ */
const SYS_EVENTS = [
  { icon: UserPlus, color: "text-cama bg-cama-50", type: "Inscription", text: "Oumarou Moussa a rejoint l'École d'Informatique", time: "09:12" },
  { icon: ShieldCheck, color: "text-amber-600 bg-amber-50", type: "Proctoring", text: "Signalement onglet — copie INF201 (Nadia M.) transmis au jury", time: "08:54" },
  { icon: BookOpen, color: "text-green-600 bg-green-50", type: "Publication", text: "Cours « Développement web full-stack » publié par Pr. Bello", time: "08:30" },
  { icon: Radio, color: "text-red-500 bg-red-50", type: "Live", text: "Classe virtuelle « TD Arbres binaires » démarrée — 47 connectés", time: "08:00" },
  { icon: Database, color: "text-cama bg-cama-50", type: "Système", text: "Sauvegarde automatique de la base — OK (1,2 Go)", time: "03:00" },
  { icon: Gavel, color: "text-purple-600 bg-purple-50", type: "Jury", text: "Délibération S3 planifiée — salle A12, 25 juin 9h", time: "Hier" },
  { icon: Megaphone, color: "text-gold-dark bg-gold/10", type: "Circulaire", text: "Note de service publiée : fermeture administrative 14 juillet", time: "Hier" },
  { icon: AlertTriangle, color: "text-red-500 bg-red-50", type: "Alerte", text: "5 examens sans surveillance assignée — action requise", time: "Hier" },
];

function SystemConsole() {
  return (
    <aside className="bg-white border-r border-border overflow-x-hidden lg:sticky lg:top-[112px] lg:h-[calc(100vh-112px)] lg:overflow-y-auto">
      <div className="px-4 py-3 border-b-2 border-ink flex items-baseline justify-between">
        <div>
          <p className="text-base font-black text-ink tracking-tight uppercase flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Console
          </p>
          <p className="text-[10px] text-subtle">Flux d&apos;activité · temps réel</p>
        </div>
        <span className="flex items-center gap-1 text-[9px] font-bold text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
        </span>
      </div>

      {/* Santé système */}
      <div className="px-4 py-3 border-b border-border bg-surface/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Uptime", value: "99.9%", color: "text-green-600" },
            { label: "Latence", value: "82ms", color: "text-cama" },
            { label: "Charge", value: "34%", color: "text-gold-dark" },
          ].map((s) => (
            <div key={s.label}>
              <p className={`text-sm font-bold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border">
        {SYS_EVENTS.map((e, i) => (
          <div key={i} className="px-4 py-3 hover:bg-surface transition-colors">
            <div className="flex items-start gap-2.5">
              <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${e.color.split(" ")[1]}`}>
                <e.icon className={`w-3.5 h-3.5 ${e.color.split(" ")[0]}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${e.color.split(" ")[0]}`}>{e.type}</span>
                  <span className="text-[9px] text-subtle font-mono flex-shrink-0">{e.time}</span>
                </div>
                <p className="text-[11px] text-ink leading-snug mt-0.5">{e.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3">
        <button className="w-full text-[11px] font-bold text-ink border border-ink py-1.5 hover:bg-ink hover:text-white transition-colors flex items-center justify-center gap-1.5">
          <Activity className="w-3 h-3" /> Journal d&apos;audit complet →
        </button>
      </div>
    </aside>
  );
}

/* Coquille 3 colonnes admin */
function AdminShell({ children, right }: { children: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr_250px] items-start">
      <SystemConsole />
      <div className="px-4 py-3 border-r border-border min-h-full">{children}</div>
      <div className="bg-white min-h-full border-l border-border lg:border-l-0">{right}</div>
    </div>
  );
}

function GradientNote({ icon: Icon, title, body }: { icon: typeof Bot; title: string; body: string }) {
  return (
    <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
      <Icon className="w-5 h-5 text-gold mb-1.5" />
      <p className="font-bold text-sm leading-snug mb-1">{title}</p>
      <p className="text-white/60 text-xs leading-relaxed">{body}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TABLEAU DE BORD (vue d'ensemble)
════════════════════════════════════════════════════════════ */
const KPIS = [
  { icon: Users, label: "Étudiants actifs", value: "1 247", delta: "+38 ce mois", color: "text-cama" },
  { icon: GraduationCap, label: "Enseignants", value: "34", delta: "+2 ce mois", color: "text-gold-dark" },
  { icon: BookOpen, label: "Cours publiés", value: "89", delta: "+5 ce mois", color: "text-green-600" },
  { icon: ShieldCheck, label: "Examens planifiés", value: "12", delta: "7 cette semaine", color: "text-purple-600" },
];

const ACTIVITY_7D = [
  { d: "Lun", v: 62 }, { d: "Mar", v: 78 }, { d: "Mer", v: 71 },
  { d: "Jeu", v: 88 }, { d: "Ven", v: 95 }, { d: "Sam", v: 41 }, { d: "Dim", v: 34 },
];

const SCHOOLS = [
  { name: "École d'Informatique", count: 512, color: "bg-cama" },
  { name: "École de Gestion", count: 389, color: "bg-gold" },
  { name: "École des Sciences", count: 221, color: "bg-green-500" },
  { name: "École de Droit", count: 125, color: "bg-purple-400" },
];

const RECENT_USERS = [
  { initials: "OM", name: "Oumarou Moussa", role: "Étudiant", school: "Informatique", date: "Auj. · 09:12", color: "bg-cama" },
  { initials: "CB", name: "Carine Beyala", role: "Étudiant", school: "Gestion", date: "Auj. · 08:47", color: "bg-gold" },
  { initials: "PD", name: "Pr. David Nkolo", role: "Enseignant", school: "Sciences", date: "Hier · 16:30", color: "bg-cama-700" },
  { initials: "FS", name: "Fatou Sall", role: "Étudiant", school: "Gestion", date: "Hier · 14:12", color: "bg-gold-dark" },
];

function OverviewTab() {
  const maxV = Math.max(...ACTIVITY_7D.map((a) => a.v));
  const totalSchool = SCHOOLS.reduce((a, s) => a + s.count, 0);

  const right = (
    <>
      {/* Alertes système */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-black text-ink uppercase tracking-widest">Alertes système</h2>
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500">1 urgente</span>
        </div>
        <div className="space-y-2">
          {[
            { icon: AlertTriangle, text: "5 examens sans surveillance", color: "text-amber-600 bg-amber-50" },
            { icon: ShieldCheck, text: "MAJ module proctoring IA dispo", color: "text-cama bg-cama-50" },
            { icon: CheckCircle2, text: "Backup base — OK (03:00)", color: "text-green-600 bg-green-50" },
          ].map((a, i) => (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 ${a.color.split(" ")[1]}`}>
              <a.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.color.split(" ")[0]}`} />
              <p className="text-[11px] text-ink leading-snug">{a.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Utilisation */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Utilisation</h2>
        <div className="space-y-3">
          {[
            { icon: Wifi, label: "Connexions auj.", value: 234, max: 400, color: "bg-cama" },
            { icon: Radio, label: "Examens actifs", value: 3, max: 10, color: "bg-gold" },
            { icon: HardDrive, label: "Stockage", value: 68, max: 100, color: "bg-green-500" },
          ].map(({ icon: Icon, label, value, max, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted flex items-center gap-1.5"><Icon className="w-3 h-3" /> {label}</span>
                <span className="font-bold text-ink">{value}<span className="text-subtle font-normal">/{max}</span></span>
              </div>
              <div className="h-1.5 bg-surface overflow-hidden">
                <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Infrastructure</h2>
        <div className="space-y-2">
          {[
            { icon: Server, label: "Serveur applicatif", status: "Opérationnel", ok: true },
            { icon: Database, label: "Base PostgreSQL", status: "Opérationnel", ok: true },
            { icon: Bot, label: "Service Prof IA", status: "Opérationnel", ok: true },
            { icon: Zap, label: "CDN bas-débit", status: "Dégradé · région N.", ok: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              <s.icon className="w-3.5 h-3.5 text-muted flex-shrink-0" />
              <p className="text-[11px] text-ink flex-1 min-w-0 truncate">{s.label}</p>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.ok ? "bg-green-500" : "bg-amber-400 animate-pulse"}`} title={s.status} />
            </div>
          ))}
        </div>
      </div>

      <GradientNote icon={ShieldCheck} title="Souveraineté des données"
        body="Hébergement régional, sauvegardes chiffrées quotidiennes. Aucune donnée étudiante ne quitte l'infrastructure de l'Institut." />
    </>
  );

  return (
    <AdminShell right={right}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <ShieldCheck className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Tableau de bord</h1>
        <div className="flex-1" />
        <span className="text-[10px] text-subtle">7 derniers jours</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 border border-border divide-x divide-y xl:divide-y-0 divide-border mb-2 bg-white">
        {KPIS.map(({ icon: Icon, label, value, delta, color }) => (
          <div key={label} className="p-3">
            <Icon className={`w-4 h-4 mb-1.5 ${color}`} />
            <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
            <p className="text-[11px] font-medium text-ink mt-1">{label}</p>
            <p className="text-[9px] text-muted mt-0.5 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-green-500" /> {delta}</p>
          </div>
        ))}
      </div>

      {/* Graphe activité + répartition écoles */}
      <div className="grid lg:grid-cols-2 gap-2 mb-2">
        {/* Connexions 7j */}
        <div className="border border-border bg-white p-3">
          <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-cama" /> Connexions / jour</p>
          <div className="flex items-end justify-between gap-1.5 h-28">
            {ACTIVITY_7D.map((a) => (
              <div key={a.d} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-surface flex items-end" style={{ height: "88px" }}>
                  <div className="w-full bg-gradient-to-t from-cama to-cama-400 transition-all duration-700" style={{ height: `${(a.v / maxV) * 100}%` }} title={`${a.v}%`} />
                </div>
                <span className="text-[9px] text-subtle">{a.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition écoles */}
        <div className="border border-border bg-white p-3">
          <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-cama" /> Étudiants par école</p>
          <div className="space-y-2.5">
            {SCHOOLS.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted truncate">{s.name}</span>
                  <span className="font-bold text-ink flex-shrink-0 ml-2">{s.count}</span>
                </div>
                <div className="h-1.5 bg-surface overflow-hidden">
                  <div className={`h-full ${s.color}`} style={{ width: `${(s.count / totalSchool) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2 mt-3">Actions rapides</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border mb-2">
        {[
          { icon: UserPlus, label: "Ajouter utilisateur", color: "text-cama" },
          { icon: BookOpen, label: "Modérer un cours", color: "text-gold-dark" },
          { icon: Megaphone, label: "Publier circulaire", color: "text-green-600" },
          { icon: Activity, label: "Logs & audit", color: "text-purple-600" },
        ].map(({ icon: Icon, label, color }) => (
          <button key={label} className="bg-white p-3 flex flex-col items-center gap-2 hover:bg-cama-50/40 transition-colors text-center group">
            <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
            <p className="text-[11px] font-medium text-ink leading-snug">{label}</p>
          </button>
        ))}
      </div>

      {/* Inscriptions récentes */}
      <div className="flex items-center justify-between mb-2 mt-3">
        <p className="text-[10px] font-black text-ink uppercase tracking-widest">Inscriptions récentes</p>
        <span className="text-[10px] font-bold text-cama">Voir tout →</span>
      </div>
      <div className="border border-border divide-y divide-border bg-white">
        {RECENT_USERS.map((u, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 hover:bg-surface/50 transition-colors">
            <div className={`w-8 h-8 rounded-full ${u.color} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>{u.initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{u.name}</p>
              <p className="text-[10px] text-subtle">{u.school}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 ${u.role === "Enseignant" ? "bg-gold/10 text-gold-dark" : "bg-cama-50 text-cama"}`}>{u.role}</span>
            <span className="text-[10px] text-subtle hidden sm:flex items-center gap-1 flex-shrink-0"><Clock className="w-3 h-3" /> {u.date}</span>
            <ChevronRight className="w-4 h-4 text-subtle flex-shrink-0" />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

/* ════════════════════════════════════════════════════════════
   UTILISATEURS (gestion complète)
════════════════════════════════════════════════════════════ */
const ALL_USERS = [
  { initials: "JM", name: "Jean-Paul Mbarga", email: "jp.mbarga@jfn.cm", role: "Étudiant", school: "Informatique", level: "L2", active: true, color: "bg-cama" },
  { initials: "NM", name: "Nadia Mbeki", email: "n.mbeki@jfn.cm", role: "Étudiant", school: "Informatique", level: "L2", active: true, color: "bg-gold" },
  { initials: "AB", name: "Pr. Amina Bello", email: "a.bello@jfn.cm", role: "Enseignant", school: "Informatique", level: "—", active: true, color: "bg-cama-700" },
  { initials: "OM", name: "Oumarou Moussa", email: "o.moussa@jfn.cm", role: "Étudiant", school: "Informatique", level: "L2", active: true, color: "bg-green-500" },
  { initials: "DN", name: "Pr. David Nkolo", email: "d.nkolo@jfn.cm", role: "Enseignant", school: "Sciences", level: "—", active: false, color: "bg-purple-500" },
  { initials: "CB", name: "Carine Beyala", email: "c.beyala@jfn.cm", role: "Étudiant", school: "Gestion", level: "L1", active: true, color: "bg-gold-dark" },
  { initials: "ME", name: "Mme Essomba", email: "essomba@jfn.cm", role: "Jury", school: "Administration", level: "—", active: true, color: "bg-cama" },
];

function UsersTab() {
  const [role, setRole] = useState("Tous");
  const [q, setQ] = useState("");
  const roles = ["Tous", "Étudiant", "Enseignant", "Jury"];
  const filtered = ALL_USERS.filter((u) => (role === "Tous" || u.role === role) && (q === "" || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())));

  const right = (
    <>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Comptes par rôle</h2>
        <div className="space-y-2.5">
          {[
            { label: "Étudiants", value: 1247, color: "bg-cama" },
            { label: "Enseignants", value: 34, color: "bg-gold" },
            { label: "Jury", value: 8, color: "bg-purple-400" },
            { label: "Administrateurs", value: 3, color: "bg-green-500" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-muted"><span className={`w-2 h-2 rounded-full ${r.color}`} /> {r.label}</span>
              <span className="text-sm font-bold text-ink">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Import & rôles</h2>
        <div className="space-y-2">
          {[
            { icon: UserPlus, label: "Créer un compte" },
            { icon: FileText, label: "Import CSV / Excel" },
            { icon: Lock, label: "Gérer les permissions" },
          ].map((a) => (
            <button key={a.label} className="w-full flex items-center gap-2.5 p-2.5 border border-border hover:border-cama/40 hover:bg-cama-50/40 transition-all text-left">
              <a.icon className="w-4 h-4 text-cama flex-shrink-0" />
              <span className="text-xs font-semibold text-ink">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <GradientNote icon={Lock} title="Traçabilité totale"
        body="Chaque modification de compte est horodatée et journalisée. La désactivation conserve l'historique académique pour la certification." />
    </>
  );

  return (
    <AdminShell right={right}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <Users className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Utilisateurs</h1>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cama text-white text-[11px] font-bold hover:bg-cama-700 transition-colors">
          <UserPlus className="w-3.5 h-3.5" /> Nouvel utilisateur
        </button>
      </div>

      {/* Recherche + filtres */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-border px-3 py-2 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-subtle flex-shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom, un email…"
            className="text-sm outline-none flex-1 min-w-0 bg-transparent" />
        </div>
        <div className="flex items-center border border-border bg-white">
          <Filter className="w-3.5 h-3.5 text-subtle ml-2" />
          {roles.map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-2 text-[11px] font-bold transition-colors ${role === r ? "bg-cama text-white" : "text-muted hover:text-ink"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table utilisateurs */}
      <div className="border border-border bg-white overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface border-b border-border">
              {["Utilisateur", "Rôle", "École", "Niveau", "Statut", ""].map((h, i) => (
                <th key={i} className={`text-left text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2 ${i > 2 ? "hidden md:table-cell" : ""} ${i === 5 ? "md:table-cell" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-cama-50/30 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${u.color} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>{u.initials}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{u.name}</p>
                      <p className="text-[10px] text-subtle truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 ${
                    u.role === "Enseignant" ? "bg-gold/10 text-gold-dark" : u.role === "Jury" ? "bg-purple-50 text-purple-600" : "bg-cama-50 text-cama"
                  }`}>{u.role}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted">{u.school}</td>
                <td className="px-3 py-2.5 text-xs text-ink hidden md:table-cell">{u.level}</td>
                <td className="px-3 py-2.5 hidden md:table-cell">
                  {u.active
                    ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Actif</span>
                    : <span className="inline-flex items-center gap-1 text-[9px] font-bold text-subtle"><span className="w-1.5 h-1.5 rounded-full bg-border" /> Inactif</span>}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button className="text-subtle hover:text-cama transition-colors"><MoreVertical className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted">Aucun utilisateur ne correspond.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-subtle mt-2">{filtered.length} compte(s) affiché(s) · gestion des inscriptions, rôles et permissions.</p>
    </AdminShell>
  );
}

/* ════════════════════════════════════════════════════════════
   PARAMÈTRES (configuration plateforme)
════════════════════════════════════════════════════════════ */
function SettingsTab() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    proctoring: true, audioFirst: true, dataBudget: true, profIA: true,
    autoBackup: true, maintenance: false, publicVerify: true, jury: true,
  });

  /* synchronise l'état du mode maintenance au montage */
  useEffect(() => {
    setToggles((t) => ({ ...t, maintenance: getMaintenance().on }));
  }, []);

  const flip = (k: string) => setToggles((t) => {
    const next = { ...t, [k]: !t[k] };
    if (k === "maintenance") setMaintenance(next.maintenance); // active réellement la page /maintenance
    return next;
  });

  const SECTIONS: { title: string; icon: typeof Bot; items: { k: string; label: string; desc: string }[] }[] = [
    {
      title: "Sécurité des examens", icon: ShieldCheck,
      items: [
        { k: "proctoring", label: "Proctoring IA (Safe-CAMA)", desc: "Détection onglet, plein écran imposé, signalements au jury." },
        { k: "jury", label: "Validation humaine obligatoire", desc: "Aucune note publiée sans délibération du jury." },
      ],
    },
    {
      title: "Optimisation bas-débit", icon: Zap,
      items: [
        { k: "audioFirst", label: "Audio prioritaire sur les lives", desc: "Bascule automatique en audio seul si le débit chute." },
        { k: "dataBudget", label: "Data budgeting", desc: "Afficher le poids en Mo de chaque ressource avant ouverture." },
      ],
    },
    {
      title: "Pédagogie & IA", icon: Bot,
      items: [
        { k: "profIA", label: "Prof IA disponible", desc: "Tuteur ancré sur le contenu des cours, activable par enseignant." },
      ],
    },
    {
      title: "Système", icon: Server,
      items: [
        { k: "autoBackup", label: "Sauvegarde automatique quotidienne", desc: "Backup chiffré de la base à 03:00, conservation 30 jours." },
        { k: "publicVerify", label: "Vérification publique des diplômes", desc: "Page de vérification par QR code accessible sans connexion." },
        { k: "maintenance", label: "Mode maintenance", desc: "Affiche une page de maintenance et bloque les connexions étudiantes." },
      ],
    },
  ];

  const right = (
    <>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Année académique</h2>
        <div className="space-y-2">
          {[
            { k: "Année en cours", v: "2025 – 2026" },
            { k: "Semestre actif", v: "S2 · pair" },
            { k: "Système de notation", v: "LMD · /20 · ECTS" },
            { k: "Langue par défaut", v: "Français" },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between">
              <span className="text-[11px] text-muted">{r.k}</span>
              <span className="text-[11px] font-bold text-ink">{r.v}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 text-[10px] font-bold text-cama border border-cama/30 py-1.5 hover:bg-cama-50 transition-colors">Configurer le calendrier</button>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Intégrations</h2>
        <div className="space-y-2">
          {[
            { icon: Globe, label: "Portail Scolarité", ok: true },
            { icon: Database, label: "SGBD PostgreSQL", ok: true },
            { icon: Wifi, label: "Passerelle SMS / USSD", ok: true },
            { icon: Bot, label: "API Prof IA", ok: true },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              <s.icon className="w-3.5 h-3.5 text-muted flex-shrink-0" />
              <p className="text-[11px] text-ink flex-1 truncate">{s.label}</p>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-600"><Check className="w-3 h-3" /> Connecté</span>
            </div>
          ))}
        </div>
      </div>

      <GradientNote icon={Settings} title="Configuration centralisée"
        body="Les paramètres s'appliquent à toute la plateforme en temps réel. Les changements sensibles sont journalisés et réversibles." />
    </>
  );

  return (
    <AdminShell right={right}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <Settings className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Paramètres de la plateforme</h1>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="border border-border bg-white">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface/60">
              <sec.icon className="w-4 h-4 text-cama" />
              <p className="text-xs font-bold text-ink">{sec.title}</p>
            </div>
            <div className="divide-y divide-border">
              {sec.items.map((it) => (
                <div key={it.k} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{it.label}</p>
                    <p className="text-[11px] text-muted leading-snug mt-0.5">{it.desc}</p>
                  </div>
                  <button onClick={() => flip(it.k)} className="flex-shrink-0" title={toggles[it.k] ? "Activé" : "Désactivé"}>
                    {toggles[it.k]
                      ? <ToggleRight className={`w-9 h-9 ${it.k === "maintenance" ? "text-red-500" : "text-cama"}`} strokeWidth={1.5} />
                      : <ToggleLeft className="w-9 h-9 text-subtle" strokeWidth={1.5} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 p-3 bg-gold/5 border border-gold/20">
        <AlertTriangle className="w-4 h-4 text-gold-dark flex-shrink-0" />
        <p className="text-[11px] text-ink leading-snug">Le <strong>mode maintenance</strong> bloque l&apos;accès étudiant. À n&apos;activer que lors des fenêtres de maintenance planifiées.</p>
      </div>
    </AdminShell>
  );
}
