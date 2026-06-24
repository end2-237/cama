"use client";

import { useEffect, useState } from "react";
import { getMaintenance, setMaintenance } from "@/lib/maintenance";
import { CYCLE_MODES, SESSION_KINDS } from "@/lib/scheduling";
import { fetchAdminStats, fetchUsers, fetchInscriptions, type InscriptionWithUser } from "@/lib/admin";
import { fetchProgram, fetchSessions, upsertSession } from "@/lib/program";
import { fetchCalendar, addCalendarEvent, deleteCalendarEvent, seedCalendar } from "@/lib/calendar";
import type { DBUser, DBSession, DBProgramCourse, DBCalendarEvent, CalEventType } from "@/lib/supabase";
import {
  Users, BookOpen, GraduationCap, ShieldCheck, AlertTriangle,
  CheckCircle2, Clock, ChevronRight, UserPlus, Settings, BarChart2,
  Activity, Server, Database, Radio, Megaphone, FileText, Search,
  Wifi, HardDrive, Lock, Building2, Zap, Bot,
  Terminal, Filter, MoreVertical, Check, ToggleRight, ToggleLeft, Globe,
  CalendarDays, Plus, X, Trash2, Send, MapPin,
} from "lucide-react";

/* ── Helpers données réelles ── */
const ROLE_LABEL: Record<string, string> = {
  etudiant: "Étudiant", enseignant: "Enseignant", jury: "Jury", admin: "Administrateur",
};
function initialsOf(first?: string | null, last?: string | null) {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "??";
}
function relTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Auj. · ${time}`;
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return `Hier · ${time}`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + ` · ${time}`;
}
const AVATAR_COLORS = ["bg-cama", "bg-gold", "bg-cama-700", "bg-gold-dark", "bg-green-500", "bg-purple-500"];

export default function AdminView({ tab }: { tab: string }) {
  if (tab === "Planification") return <PlanningTab />;
  if (tab === "Utilisateurs") return <UsersTab />;
  if (tab === "Paramètres")   return <SettingsTab />;
  return <OverviewTab />;
}

/* ════════════════════════════════════════════════════════════
   CONSOLE SYSTÈME — flux d'activité temps réel (colonne gauche)
════════════════════════════════════════════════════════════ */
type SysEvent = { icon: typeof UserPlus; color: string; type: string; text: string; time: string; ts: number };

function SystemConsole() {
  const [events, setEvents] = useState<SysEvent[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [inscriptions, users, program] = await Promise.all([
        fetchInscriptions(),
        fetchUsers(),
        fetchProgram(),
      ]);
      if (!active) return;
      const evts: SysEvent[] = [];
      inscriptions.slice(0, 5).forEach((i) => {
        const name = `${i.user?.first_name ?? ""} ${i.user?.last_name ?? ""}`.trim() || "Un étudiant";
        evts.push({
          icon: UserPlus, color: "text-cama bg-cama-50", type: "Inscription",
          text: `${name} a rejoint ${i.school}`, time: relTime(i.enrolled_at), ts: new Date(i.enrolled_at).getTime(),
        });
      });
      users.slice(0, 5).forEach((u) => {
        evts.push({
          icon: Users, color: "text-gold-dark bg-gold/10", type: "Compte",
          text: `${u.first_name} ${u.last_name} (${ROLE_LABEL[u.role] ?? u.role}) a créé un compte`,
          time: relTime(u.created_at), ts: new Date(u.created_at).getTime(),
        });
      });
      program.filter((c) => c.published).slice(0, 5).forEach((c) => {
        evts.push({
          icon: BookOpen, color: "text-green-600 bg-green-50", type: "Publication",
          text: `Cours « ${c.title} » publié`, time: relTime(c.created_at), ts: new Date(c.created_at).getTime(),
        });
      });
      evts.sort((a, b) => b.ts - a.ts);
      setEvents(evts.slice(0, 12));
    })();
    return () => { active = false; };
  }, []);

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
        {events.length === 0 && (
          <div className="px-4 py-3 text-[11px] text-subtle">Aucune activité récente.</div>
        )}
        {events.map((e, i) => (
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
const SCHOOL_COLORS = ["bg-cama", "bg-gold", "bg-green-500", "bg-purple-400", "bg-cama-700", "bg-gold-dark"];

function OverviewTab() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, pending: 0, validated: 0 });
  const [publishedCount, setPublishedCount] = useState(0);
  const [schools, setSchools] = useState<{ name: string; count: number; color: string }[]>([]);
  const [recentUsers, setRecentUsers] = useState<{ initials: string; name: string; role: string; school: string; date: string; color: string }[]>([]);
  const [activity7d, setActivity7d] = useState<{ d: string; v: number }[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [s, program, inscriptions, users] = await Promise.all([
        fetchAdminStats(),
        fetchProgram(),
        fetchInscriptions(),
        fetchUsers(),
      ]);
      if (!active) return;
      setStats(s);
      setPublishedCount(program.filter((c) => c.published).length);

      // Répartition par école (inscriptions groupées)
      const bySchool = new Map<string, number>();
      inscriptions.forEach((i) => bySchool.set(i.school, (bySchool.get(i.school) ?? 0) + 1));
      setSchools(
        [...Array.from(bySchool.entries())]
          .sort((a, b) => b[1] - a[1])
          .map(([name, count], idx) => ({ name, count, color: SCHOOL_COLORS[idx % SCHOOL_COLORS.length] }))
      );

      // Inscriptions récentes
      setRecentUsers(
        inscriptions.slice(0, 4).map((i, idx) => ({
          initials: initialsOf(i.user?.first_name, i.user?.last_name),
          name: `${i.user?.first_name ?? ""} ${i.user?.last_name ?? ""}`.trim() || "—",
          role: "Étudiant",
          school: i.school,
          date: relTime(i.enrolled_at),
          color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
        }))
      );

      // Nouveaux comptes / jour — 7 derniers jours
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      const today = new Date();
      const buckets: { d: string; v: number }[] = [];
      for (let k = 6; k >= 0; k--) {
        const day = new Date(today); day.setDate(today.getDate() - k);
        const v = users.filter((u) => new Date(u.created_at).toDateString() === day.toDateString()).length;
        buckets.push({ d: days[day.getDay()], v });
      }
      setActivity7d(buckets);
    })();
    return () => { active = false; };
  }, []);

  const KPIS = [
    { icon: Users, label: "Étudiants actifs", value: String(stats.students), color: "text-cama" },
    { icon: GraduationCap, label: "Enseignants", value: String(stats.teachers), color: "text-gold-dark" },
    { icon: BookOpen, label: "Cours publiés", value: String(publishedCount), color: "text-green-600" },
    { icon: ShieldCheck, label: "Inscriptions en attente", value: String(stats.pending), color: "text-purple-600" },
  ];

  const maxV = Math.max(1, ...activity7d.map((a) => a.v));
  const totalSchool = schools.reduce((a, s) => a + s.count, 0) || 1;

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
        {KPIS.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-3">
            <Icon className={`w-4 h-4 mb-1.5 ${color}`} />
            <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
            <p className="text-[11px] font-medium text-ink mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Graphe activité + répartition écoles */}
      <div className="grid lg:grid-cols-2 gap-2 mb-2">
        {/* Connexions 7j */}
        <div className="border border-border bg-white p-3">
          <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-cama" /> Nouveaux comptes / jour</p>
          <div className="flex items-end justify-between gap-1.5 h-28">
            {activity7d.map((a, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-surface flex items-end" style={{ height: "88px" }}>
                  <div className="w-full bg-gradient-to-t from-cama to-cama-400 transition-all duration-700" style={{ height: `${(a.v / maxV) * 100}%` }} title={`${a.v}`} />
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
            {schools.length === 0 && <p className="text-xs text-muted">Aucune inscription.</p>}
            {schools.map((s) => (
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
        {recentUsers.length === 0 && <p className="px-4 py-6 text-sm text-muted text-center">Aucune inscription récente.</p>}
        {recentUsers.map((u, i) => (
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
type UserRow = { initials: string; name: string; email: string; role: string; school: string; level: string; active: boolean; color: string };

function UsersTab() {
  const [role, setRole] = useState("Tous");
  const [q, setQ] = useState("");
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [roleCounts, setRoleCounts] = useState({ etudiant: 0, enseignant: 0, jury: 0, admin: 0 });
  const roles = ["Tous", "Étudiant", "Enseignant", "Jury"];

  useEffect(() => {
    let active = true;
    (async () => {
      const [users, inscriptions] = await Promise.all([fetchUsers(), fetchInscriptions()]);
      if (!active) return;
      const insByUser = new Map<string, InscriptionWithUser>();
      inscriptions.forEach((i) => { if (!insByUser.has(i.user_id)) insByUser.set(i.user_id, i); });
      setAllUsers(
        users.map((u: DBUser, idx) => {
          const ins = insByUser.get(u.id);
          return {
            initials: initialsOf(u.first_name, u.last_name),
            name: `${u.first_name} ${u.last_name}`.trim() || "—",
            email: u.email,
            role: ROLE_LABEL[u.role] ?? u.role,
            school: u.school ?? ins?.school ?? "—",
            level: u.level ?? ins?.level ?? "—",
            active: true,
            color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          };
        })
      );
      const counts = { etudiant: 0, enseignant: 0, jury: 0, admin: 0 };
      users.forEach((u) => { if (u.role in counts) counts[u.role as keyof typeof counts]++; });
      setRoleCounts(counts);
    })();
    return () => { active = false; };
  }, []);

  const filtered = allUsers.filter((u) => (role === "Tous" || u.role === role) && (q === "" || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())));

  const right = (
    <>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Comptes par rôle</h2>
        <div className="space-y-2.5">
          {[
            { label: "Étudiants", value: roleCounts.etudiant, color: "bg-cama" },
            { label: "Enseignants", value: roleCounts.enseignant, color: "bg-gold" },
            { label: "Jury", value: roleCounts.jury, color: "bg-purple-400" },
            { label: "Administrateurs", value: roleCounts.admin, color: "bg-green-500" },
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

/* ════════════════════════════════════════════════════════════
   PLANIFICATION (calendrier annuel + validation propositions)
════════════════════════════════════════════════════════════ */
const EV_TYPES = ["cours", "examen", "jury", "resultat", "admin", "vacances", "event"] as const;
const EV_LABEL: Record<string, string> = {
  cours: "Enseignement", examen: "Examens", jury: "Jury", resultat: "Résultats",
  admin: "Administratif", vacances: "Vacances", event: "Événement",
};
const SESSION_STATUS = {
  propose: { label: "En attente", cls: "bg-gold/10 text-gold-dark" },
  valide:  { label: "Validée", cls: "bg-green-50 text-green-600" },
  rejete:  { label: "Refusée", cls: "bg-red-50 text-red-500" },
} as const;

function PlanningTab() {
  const [evDate, setEvDate] = useState("");
  const [evLabel, setEvLabel] = useState("");
  const [evType, setEvType] = useState<string>("cours");
  const [evSem, setEvSem] = useState<1 | 2>(2);
  const [sessions, setSessions] = useState<DBSession[]>([]);
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<DBCalendarEvent[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const program = await fetchProgram();
      const sess = await fetchSessions(program.map((c) => c.id));
      const cal = await seedCalendar();
      if (!active) return;
      setCourses(program);
      setSessions(sess);
      setCalendarEvents(cal);
    })();
    return () => { active = false; };
  }, []);

  const courseOf = (id: string) => courses.find((c) => c.id === id);
  const proposals = sessions.filter((s) => s.status === "propose");
  const validated = sessions.filter((s) => s.status === "valide");
  // Les demandes de créneaux étudiants n'ont pas encore d'équivalent en base.
  const pendingSlots: never[] = [];
  const slotRequests: { id: string; studentId: string; day: string; start: string; end: string; ue: string; note: string; status: "propose" | "valide" | "rejete" }[] = [];

  const addEvent = async () => {
    if (!evDate.trim() || !evLabel.trim()) return;
    const created = await addCalendarEvent({ date_label: evDate.trim(), label: evLabel.trim(), type: evType as CalEventType, semester: evSem });
    if (created) setCalendarEvents((prev) => [...prev, created]);
    setEvDate(""); setEvLabel("");
  };
  const setSession = async (id: string, status: "valide" | "rejete") => {
    await upsertSession({ id, status });
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };
  // Pas d'équivalent en base pour les créneaux étudiants.
  const setSlot = (id: string, status: "valide" | "rejete") => { void id; void status; };
  const delEvent = async (id: string) => {
    await deleteCalendarEvent(id);
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  };
  void fetchCalendar;

  const right = (
    <>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">À traiter</h2>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {[
            { value: String(proposals.length), label: "propositions profs", color: "text-gold-dark" },
            { value: String(pendingSlots.length), label: "créneaux étudiants", color: "text-cama" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-2.5 text-center">
              <p className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Séances validées par mode</h2>
        <div className="space-y-2.5">
          {CYCLE_MODES.map((m) => {
            const n = validated.filter((s) => s.modes.includes(m.id)).length;
            const max = validated.length || 1;
            return (
              <div key={m.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-2 text-muted"><span className="w-2 h-2 rounded-full" style={{ background: m.color }} /> {m.short}</span>
                  <span className="font-bold text-ink">{n}</span>
                </div>
                <div className="h-1.5 bg-surface overflow-hidden"><div className="h-full" style={{ width: `${(n / max) * 100}%`, background: m.color }} /></div>
              </div>
            );
          })}
        </div>
      </div>
      <GradientNote icon={CalendarDays} title="Propose → Valide → Reçoit"
        body="Les enseignants proposent les séances, vous les validez et planifiez ici, les étudiants les reçoivent dans leur calendrier selon leur mode d'inscription." />
    </>
  );

  return (
    <AdminShell right={right}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <CalendarDays className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Planification</h1>
      </div>

      {/* ── Propositions de séances (profs) ── */}
      <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <Send className="w-3.5 h-3.5 text-cama" /> Propositions des enseignants
        {proposals.length > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark">{proposals.length} en attente</span>}
      </p>
      <div className="border border-border divide-y divide-border bg-white mb-4">
        {sessions.length === 0 && <p className="px-4 py-6 text-sm text-muted text-center">Aucune séance proposée.</p>}
        {[...proposals, ...sessions.filter((s) => s.status !== "propose")].map((s) => {
          const k = SESSION_KINDS[s.kind];
          const st = SESSION_STATUS[s.status];
          const ue = courseOf(s.program_course_id);
          return (
            <div key={s.id} className="p-3 flex items-center gap-3 flex-wrap">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 border flex-shrink-0 ${k.color}`}>{k.label}</span>
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-ink">{s.title}</p>
                <p className="text-[11px] text-muted flex items-center gap-2 flex-wrap mt-0.5">
                  <span>{ue?.code}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.day} · {s.end_time ? `${s.start_time}–${s.end_time}` : s.start_time}</span>
                  {s.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.room}</span>}
                </p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {s.modes.map((m) => {
                    const mm = CYCLE_MODES.find((x) => x.id === m)!;
                    return <span key={m} className="text-[8px] font-bold px-1.5 py-0.5 text-white" style={{ background: mm.color }}>{mm.short}</span>;
                  })}
                </div>
              </div>
              {s.status === "propose" ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setSession(s.id, "valide")} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-[11px] font-bold hover:bg-green-600 transition-colors"><Check className="w-3.5 h-3.5" /> Valider</button>
                  <button onClick={() => setSession(s.id, "rejete")} className="flex items-center gap-1 px-2.5 py-1.5 border border-border text-muted text-[11px] font-bold hover:border-red-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /> Refuser</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 ${st.cls}`}>{st.label}</span>
                  {s.status === "rejete" && <button onClick={() => setSession(s.id, "valide")} className="text-[10px] font-bold text-cama hover:underline">Revalider</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Demandes de créneaux (étudiants) ── */}
      <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-cama" /> Créneaux proposés par les étudiants
        {pendingSlots.length > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama">{pendingSlots.length} en attente</span>}
      </p>
      <div className="border border-border divide-y divide-border bg-white mb-4">
        {slotRequests.length === 0 && <p className="px-4 py-6 text-sm text-muted text-center">Aucune demande de créneau.</p>}
        {slotRequests.map((r) => {
          const st = SESSION_STATUS[r.status];
          return (
            <div key={r.id} className="p-3 flex items-center gap-3 flex-wrap">
              <div className="w-9 h-9 rounded-full bg-cama-50 text-cama flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {r.studentId === "u1" ? "JP" : "ÉT"}
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-subtle" /> {r.day} · {r.start}–{r.end} <span className="text-[11px] text-muted font-normal">· {r.ue}</span>
                </p>
                <p className="text-[11px] text-muted leading-snug mt-0.5">{r.note}</p>
              </div>
              {r.status === "propose" ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setSlot(r.id, "valide")} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-[11px] font-bold hover:bg-green-600 transition-colors"><Check className="w-3.5 h-3.5" /> Valider</button>
                  <button onClick={() => setSlot(r.id, "rejete")} className="flex items-center gap-1 px-2.5 py-1.5 border border-border text-muted text-[11px] font-bold hover:border-red-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /> Refuser</button>
                </div>
              ) : (
                <span className={`text-[10px] font-bold px-2 py-0.5 ${st.cls}`}>{st.label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Calendrier académique annuel ── */}
      <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5 text-cama" /> Calendrier académique annuel
      </p>
      <div className="border border-border bg-white p-3 mb-2">
        <div className="grid sm:grid-cols-[1fr_1.4fr_auto_auto_auto] gap-2 items-end">
          <div>
            <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">Date</label>
            <input value={evDate} onChange={(e) => setEvDate(e.target.value)} placeholder="08 sept. 2025" className="w-full text-sm border border-border px-3 py-2 outline-none focus:border-cama" />
          </div>
          <div>
            <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">Intitulé</label>
            <input value={evLabel} onChange={(e) => setEvLabel(e.target.value)} placeholder="Début des cours…" className="w-full text-sm border border-border px-3 py-2 outline-none focus:border-cama" />
          </div>
          <div>
            <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">Type</label>
            <select value={evType} onChange={(e) => setEvType(e.target.value)} className="text-sm border border-border px-2 py-2 outline-none bg-white">
              {EV_TYPES.map((t) => <option key={t} value={t}>{EV_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">Sem.</label>
            <select value={evSem} onChange={(e) => setEvSem(Number(e.target.value) as 1 | 2)} className="text-sm border border-border px-2 py-2 outline-none bg-white">
              <option value={1}>S1</option><option value={2}>S2</option>
            </select>
          </div>
          <button onClick={addEvent} className="flex items-center gap-1.5 px-4 py-2 bg-cama text-white text-[11px] font-bold hover:bg-cama-700 transition-colors h-[38px]"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {[1, 2].map((sem) => (
          <div key={sem} className="border border-border bg-white">
            <p className="px-3 py-2 bg-surface border-b border-border text-xs font-bold text-ink">Semestre {sem}</p>
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {calendarEvents.filter((e) => e.semester === sem).map((e) => (
                <div key={e.id} className="px-3 py-2 flex items-center gap-2 group">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama flex-shrink-0">{EV_LABEL[e.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-cama">{e.date_label}</p>
                    <p className="text-xs text-ink leading-snug">{e.label}</p>
                  </div>
                  <button onClick={() => delEvent(e.id)} className="p-1 text-subtle hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
