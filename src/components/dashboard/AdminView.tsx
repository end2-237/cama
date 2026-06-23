"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, BookOpen, GraduationCap, ShieldCheck, Clock, ChevronRight,
  Settings, Gavel, Loader2,
} from "lucide-react";
import { fetchAdminStats, fetchUsers, fetchInscriptions, type AdminStats, type InscriptionWithUser } from "@/lib/admin";
import { fetchProgram } from "@/lib/program";
import type { DBUser, DBProgramCourse } from "@/lib/supabase";

export default function AdminView({ tab }: { tab: string }) {
  if (tab === "Paramètres") return <SettingsTab />;
  return <OverviewTab />;
}

function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [inscriptions, setInscriptions] = useState<InscriptionWithUser[]>([]);
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, u, i, c] = await Promise.all([
        fetchAdminStats(),
        fetchUsers(),
        fetchInscriptions(),
        fetchProgram(),
      ]);
      setStats(s); setUsers(u); setInscriptions(i); setCourses(c);
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) return (
    <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
  );

  const published = courses.filter((c) => c.published).length;
  const assigned = courses.filter((c) => c.teacher_id).length;
  const recentUsers = users.slice(0, 6);
  const pendingInsc = inscriptions.filter((i) => i.status === "en_attente");

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <ShieldCheck className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Tableau de bord administrateur</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden mb-5">
        {[
          { icon: Users, label: "Étudiants", value: stats.students, color: "text-cama" },
          { icon: GraduationCap, label: "Enseignants", value: stats.teachers, color: "text-gold-dark" },
          { icon: BookOpen, label: "Matières publiées", value: `${published}/${courses.length}`, color: "text-green-600" },
          { icon: Clock, label: "Inscriptions en attente", value: stats.pending, color: "text-purple-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white p-4 text-center">
            <k.icon className={`w-5 h-5 mx-auto mb-1 ${k.color}`} />
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-muted mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        {/* Actions rapides */}
        <div className="bg-white border border-border rounded-xl p-4">
          <h2 className="text-xs font-bold text-ink uppercase tracking-widest mb-3">Actions rapides</h2>
          <div className="space-y-2">
            {[
              { icon: BookOpen, label: "Gérer le programme académique", href: "/admin/programme", color: "text-cama" },
              { icon: Users, label: "Gérer les utilisateurs & inscriptions", href: "/admin/utilisateurs", color: "text-gold-dark" },
              { icon: Gavel, label: "Délibérations du jury", href: "/jury/deliberations", color: "text-purple-600" },
            ].map((a) => (
              <Link key={a.href} href={a.href}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-cama/40 hover:bg-cama-50/30 transition-all">
                <a.icon className={`w-5 h-5 ${a.color}`} />
                <span className="text-sm font-medium text-ink flex-1">{a.label}</span>
                <ChevronRight className="w-4 h-4 text-subtle" />
              </Link>
            ))}
          </div>
        </div>

        {/* Programme résumé */}
        <div className="bg-white border border-border rounded-xl p-4">
          <h2 className="text-xs font-bold text-ink uppercase tracking-widest mb-3">Programme académique</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { label: "Matières total", value: courses.length },
              { label: "Enseignant assigné", value: assigned },
              { label: "Cours publiés", value: published },
              { label: "ECTS total", value: courses.reduce((a, c) => a + c.ects, 0) },
            ].map((s) => (
              <div key={s.label} className="bg-surface rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-ink">{s.value}</p>
                <p className="text-[10px] text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <Link href="/admin/programme"
            className="text-xs font-bold text-cama hover:underline flex items-center gap-1">
            Ouvrir le programme <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Inscriptions en attente */}
      {pendingInsc.length > 0 && (
        <div className="bg-white border border-border rounded-xl mb-5">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-xs font-bold text-ink uppercase tracking-widest">
              Inscriptions en attente ({pendingInsc.length})
            </h2>
            <Link href="/admin/utilisateurs" className="text-[11px] font-bold text-cama hover:underline">
              Gérer tout →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {pendingInsc.slice(0, 5).map((insc) => (
              <div key={insc.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-gold-dark text-xs font-bold">
                  {(insc.user?.first_name?.[0] ?? "?")}{(insc.user?.last_name?.[0] ?? "")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {insc.user ? `${insc.user.first_name} ${insc.user.last_name}` : insc.matricule}
                  </p>
                  <p className="text-[11px] text-muted">{insc.parcours_title} · {insc.level} · {insc.matricule}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-gold/10 text-gold-dark rounded-full">En attente</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utilisateurs récents */}
      <div className="bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-xs font-bold text-ink uppercase tracking-widest">Utilisateurs récents</h2>
          <Link href="/admin/utilisateurs" className="text-[11px] font-bold text-cama hover:underline">
            Voir tout →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentUsers.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Aucun utilisateur enregistré.</p>
          ) : recentUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-8 h-8 rounded-full bg-cama text-white flex items-center justify-center text-[10px] font-bold">
                {(u.first_name?.[0] ?? "")}{(u.last_name?.[0] ?? "")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{u.first_name} {u.last_name}</p>
                <p className="text-[10px] text-subtle truncate">{u.email}</p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                u.role === "enseignant" ? "bg-gold/10 text-gold-dark" :
                u.role === "admin" ? "bg-purple-50 text-purple-600" :
                u.role === "jury" ? "bg-purple-50 text-purple-600" :
                "bg-cama-50 text-cama"
              }`}>{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ PARAMÈTRES ═══ */
import { getMaintenance, setMaintenance } from "@/lib/maintenance";
import {
  ToggleRight, ToggleLeft, AlertTriangle, Bot, Server, Zap,
} from "lucide-react";

function SettingsTab() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    proctoring: true, audioFirst: true, dataBudget: true, profIA: true,
    autoBackup: true, maintenance: false, publicVerify: true, jury: true,
  });

  useEffect(() => {
    setToggles((t) => ({ ...t, maintenance: getMaintenance().on }));
  }, []);

  const flip = (k: string) => setToggles((t) => {
    const next = { ...t, [k]: !t[k] };
    if (k === "maintenance") setMaintenance(next.maintenance);
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

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Settings className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Paramètres de la plateforme</h1>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="border border-border rounded-xl bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/60">
              <sec.icon className="w-4 h-4 text-cama" />
              <p className="text-xs font-bold text-ink">{sec.title}</p>
            </div>
            <div className="divide-y divide-border">
              {sec.items.map((it) => (
                <div key={it.k} className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{it.label}</p>
                    <p className="text-[11px] text-muted leading-snug mt-0.5">{it.desc}</p>
                  </div>
                  <button onClick={() => flip(it.k)} className="flex-shrink-0">
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

      <div className="mt-4 flex items-center gap-2 p-3 bg-gold/5 border border-gold/20 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-gold-dark flex-shrink-0" />
        <p className="text-[11px] text-ink leading-snug">Le <strong>mode maintenance</strong> bloque l&apos;accès étudiant. À n&apos;activer que lors des fenêtres de maintenance planifiées.</p>
      </div>
    </div>
  );
}
