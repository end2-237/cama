"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Users, CheckCircle2, XCircle, Clock,
  GraduationCap, UserCog, Search, ShieldCheck, FolderOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { DBUser, UserRole, DBInscription } from "@/lib/supabase";
import {
  fetchUsers, updateUserRole, fetchInscriptions, setInscriptionStatus,
  fetchAdminStats, type InscriptionWithUser, type AdminStats,
} from "@/lib/admin";

const ROLES: UserRole[] = ["etudiant", "enseignant", "admin", "jury"];
const ROLE_LABEL: Record<UserRole, string> = {
  etudiant: "Étudiant", enseignant: "Enseignant", admin: "Admin", jury: "Jury",
};
const STATUS_BADGE: Record<DBInscription["status"], { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-gold/10 text-gold-dark" },
  validee:    { label: "Validée",    cls: "bg-green-50 text-green-600" },
  rejetee:    { label: "Rejetée",    cls: "bg-red-50 text-red-500" },
};

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab]             = useState<"inscriptions" | "users">("inscriptions");
  const [users, setUsers]         = useState<DBUser[]>([]);
  const [inscriptions, setInscr]  = useState<InscriptionWithUser[]>([]);
  const [stats, setStats]         = useState<AdminStats | null>(null);
  const [fetching, setFetching]   = useState(true);
  const [q, setQ]                 = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = async () => {
    setFetching(true);
    const [u, i, s] = await Promise.all([fetchUsers(), fetchInscriptions(), fetchAdminStats()]);
    setUsers(u); setInscr(i); setStats(s);
    setFetching(false);
  };

  useEffect(() => { reload(); }, []);

  const onRole = async (id: string, role: UserRole) => {
    setUsers((us) => us.map((u) => u.id === id ? { ...u, role } : u));
    await updateUserRole(id, role);
    setStats(await fetchAdminStats());
  };

  const onStatus = async (id: string, status: DBInscription["status"]) => {
    setInscr((is) => is.map((i) => i.id === id ? { ...i, status } : i));
    await setInscriptionStatus(id, status);
    setStats(await fetchAdminStats());
  };

  const pendingByUser = useMemo(() => {
    const s = new Set<string>();
    inscriptions.forEach((i) => { if (i.status === "en_attente") s.add(i.user_id); });
    return s;
  }, [inscriptions]);

  const filteredUsers = useMemo(() => {
    const s = q.toLowerCase();
    return users.filter((u) =>
      `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(s));
  }, [users, q]);

  const filteredInscr = useMemo(() => {
    const s = q.toLowerCase();
    return inscriptions.filter((i) =>
      `${i.matricule} ${i.parcours_title} ${i.user?.email ?? ""} ${i.user?.first_name ?? ""} ${i.user?.last_name ?? ""}`
        .toLowerCase().includes(s));
  }, [inscriptions, q]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const KPIS = stats ? [
    { icon: GraduationCap, label: "Étudiants",   value: stats.students,  color: "text-cama" },
    { icon: UserCog,       label: "Enseignants", value: stats.teachers,  color: "text-ink" },
    { icon: Clock,         label: "En attente",  value: stats.pending,   color: "text-gold-dark" },
    { icon: ShieldCheck,   label: "Validées",    value: stats.validated, color: "text-green-600" },
  ] : [];

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cama" /> Utilisateurs & inscriptions
          </span>
          <div className="flex-1" />
          <Link href="/admin/programme" className="text-xs font-bold text-cama hover:underline">Programme →</Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5">
        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden mb-5">
            {KPIS.map((k) => (
              <div key={k.label} className="bg-white p-3 text-center">
                <k.icon className={`w-4 h-4 mx-auto mb-1 ${k.color}`} />
                <p className={`text-lg font-bold leading-none ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-muted mt-1">{k.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Onglets + recherche */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-0.5 bg-white border border-border rounded-xl p-1">
            {([["inscriptions", "Inscriptions"], ["users", "Tous les utilisateurs"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === k ? "bg-cama text-white shadow-sm" : "text-muted hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5 flex-1 max-w-xs focus-within:border-cama">
            <Search className="w-3.5 h-3.5 text-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…"
              className="bg-transparent text-xs outline-none w-full" />
          </div>
        </div>

        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : tab === "inscriptions" ? (
          /* ── Inscriptions ── */
          filteredInscr.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-muted">Aucune inscription.</div>
          ) : (
            <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
              {filteredInscr.map((i) => {
                const b = STATUS_BADGE[i.status];
                return (
                  <div key={i.id} className="flex flex-wrap items-center gap-3 p-3">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-sm font-bold text-ink">
                        {i.user ? `${i.user.first_name} ${i.user.last_name}` : i.matricule}
                        <span className="ml-2 text-[11px] font-mono text-muted">{i.matricule}</span>
                      </p>
                      <p className="text-[11px] text-muted">
                        {i.parcours_title} · {i.level} · mode {i.mode} · {i.academic_year}
                        {i.user?.email && <> · {i.user.email}</>}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => onStatus(i.id, "validee")} disabled={i.status === "validee"}
                        className="flex items-center gap-1 text-[11px] font-bold text-green-600 border border-green-200 rounded-lg px-2.5 py-1.5 hover:bg-green-50 disabled:opacity-40 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valider
                      </button>
                      <button onClick={() => onStatus(i.id, "rejetee")} disabled={i.status === "rejetee"}
                        className="flex items-center gap-1 text-[11px] font-bold text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 disabled:opacity-40 transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Rejeter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ── Tous les utilisateurs ── */
          filteredUsers.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-muted">Aucun utilisateur.</div>
          ) : (
            <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: u.avatar_color || "#6366f1" }}>
                    {(u.first_name[0] ?? "?")}{(u.last_name[0] ?? "")}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm font-bold text-ink flex items-center gap-2">
                      {u.first_name} {u.last_name}
                      {u.role === "etudiant" && pendingByUser.has(u.id) && (
                        <span className="text-[9px] font-bold uppercase tracking-wide bg-gold/10 text-gold-dark px-1.5 py-0.5 rounded">À valider</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted">{u.email}{u.level && ` · ${u.level}`}{u.school && ` · ${u.school}`}</p>
                  </div>
                  {u.role === "etudiant" && (
                    <Link href={`/admin/etudiant/${u.id}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cama border border-cama/30 rounded-lg px-2.5 py-1.5 hover:bg-cama-50 transition-colors">
                      <FolderOpen className="w-3.5 h-3.5" /> Dossier
                    </Link>
                  )}
                  <select value={u.role} onChange={(e) => onRole(u.id, e.target.value as UserRole)}
                    className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:border-cama">
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
