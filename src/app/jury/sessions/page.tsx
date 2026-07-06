"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, Gavel, Plus, Users, ChevronRight, X, UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import { fetchYears, type DBAcademicYear } from "@/lib/academic";
import { fetchProgram } from "@/lib/program";
import { fetchUsers } from "@/lib/admin";
import type { DBUser } from "@/lib/supabase";
import {
  createJurySession, fetchJurySessions, addJuryMember, fetchJuryMembers, removeJuryMember,
  type DBJurySession, type JuryMemberWithUser,
} from "@/lib/jury";

const ROLES_JURY = ["president", "membre", "secretaire"] as const;
const ROLE_LABEL: Record<string, string> = {
  president: "Président", membre: "Membre", secretaire: "Secrétaire",
};

export default function JurySessionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<DBJurySession[]>([]);
  const [years, setYears] = useState<DBAcademicYear[]>([]);
  const [parcours, setParcours] = useState<string[]>([]);
  const [staff, setStaff] = useState<DBUser[]>([]);
  const [fetching, setFetching] = useState(true);

  // Formulaire de création
  const [showForm, setShowForm] = useState(false);
  const [fYear, setFYear] = useState("");
  const [fSem, setFSem] = useState(1);
  const [fParcours, setFParcours] = useState("");
  const [creating, setCreating] = useState(false);

  // Gestion des membres
  const [membersFor, setMembersFor] = useState<string | null>(null);
  const [members, setMembers] = useState<JuryMemberWithUser[]>([]);
  const [mUser, setMUser] = useState("");
  const [mRole, setMRole] = useState<string>("membre");

  useEffect(() => {
    if (!loading && (!user || (user.role !== "jury" && user.role !== "admin"))) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = async () => {
    setFetching(true);
    const [ss, ys, prog, us] = await Promise.all([
      fetchJurySessions(), fetchYears(), fetchProgram(), fetchUsers(),
    ]);
    setSessions(ss);
    setYears(ys);
    setParcours(Array.from(new Set(prog.map((c) => c.parcours_slug))).sort());
    setStaff(us.filter((u) => u.role === "jury" || u.role === "admin" || u.role === "enseignant"));
    setFetching(false);
  };
  useEffect(() => { reload(); }, []);

  useEffect(() => {
    if (years.length && !fYear) setFYear(years.find((y) => y.is_current)?.label ?? years[0].label);
  }, [years, fYear]);

  const create = async () => {
    if (!user || !fYear || !fParcours) return;
    setCreating(true);
    const { data } = await createJurySession(fYear, fSem, fParcours, user.id);
    setCreating(false);
    setShowForm(false);
    if (data?.id) router.push(`/jury/session/${data.id}`);
    else reload();
  };

  const openMembers = async (sessionId: string) => {
    setMembersFor(sessionId);
    setMembers(await fetchJuryMembers(sessionId));
  };

  const addMember = async () => {
    if (!membersFor || !mUser) return;
    await addJuryMember(membersFor, mUser, mRole);
    setMUser("");
    setMembers(await fetchJuryMembers(membersFor));
  };

  const delMember = async (id: string) => {
    if (!membersFor) return;
    await removeJuryMember(id);
    setMembers(await fetchJuryMembers(membersFor));
  };

  const staffOptions = useMemo(
    () => staff.filter((s) => !members.some((m) => m.user_id === s.id)),
    [staff, members],
  );

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const openCount = sessions.filter((s) => s.status === "ouvert").length;

  return (
    <PageShell
      title="Sessions de jury"
      subtitle="Créez et composez les jurys de semestre, puis délibérez parcours par parcours."
      icon={Gavel}
      breadcrumb="Sessions de jury"
      maxWidth="max-w-[1100px]"
      actions={
        <>
          <Link href="/jury/deliberations" className="text-sm text-cama font-semibold hover:underline">Délibérations →</Link>
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-cama rounded-lg px-3 py-1.5 hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Nouvelle session
          </button>
        </>
      }
      stats={[
        { label: "Sessions", value: sessions.length,               accent: "ink" },
        { label: "Ouvertes", value: openCount,                     accent: "green" },
        { label: "Clôturées", value: sessions.length - openCount,  accent: "gold" },
      ]}
    >
        {showForm && (
          <div className="bg-white border border-border rounded-xl p-4 mb-5">
            <p className="text-sm font-bold text-ink mb-3">Créer une session de jury</p>
            <div className="flex flex-wrap gap-2 items-end">
              <label className="text-[11px] text-muted">
                Année académique
                <select value={fYear} onChange={(e) => setFYear(e.target.value)}
                  className="block mt-1 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cama bg-white">
                  {years.map((y) => <option key={y.id} value={y.label}>{y.label}</option>)}
                </select>
              </label>
              <label className="text-[11px] text-muted">
                Semestre
                <select value={fSem} onChange={(e) => setFSem(Number(e.target.value))}
                  className="block mt-1 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cama bg-white">
                  <option value={1}>Semestre 1</option>
                  <option value={2}>Semestre 2</option>
                </select>
              </label>
              <label className="text-[11px] text-muted">
                Parcours
                <select value={fParcours} onChange={(e) => setFParcours(e.target.value)}
                  className="block mt-1 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cama bg-white min-w-[200px]">
                  <option value="">— Choisir —</option>
                  {parcours.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <button onClick={create} disabled={creating || !fYear || !fParcours}
                className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-cama rounded-lg px-3 py-2 hover:opacity-90 disabled:opacity-50">
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Créer
              </button>
            </div>
          </div>
        )}

        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : sessions.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-muted">
            Aucune session de jury. Créez une session pour délibérer sur un semestre.
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
            {sessions.map((s) => (
              <div key={s.id}>
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-bold text-ink">
                      {s.academic_year ?? "—"} · Semestre {s.semester ?? "—"} · {s.parcours_slug ?? "—"}
                    </p>
                    <p className="text-[11px] text-muted">
                      Tenue le {new Date(s.held_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === "ouvert" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {s.status === "ouvert" ? "Ouvert" : "Clôturé"}
                  </span>
                  <button onClick={() => (membersFor === s.id ? setMembersFor(null) : openMembers(s.id))}
                    className="flex items-center gap-1 text-[11px] font-bold text-ink border border-border rounded-lg px-2.5 py-1.5 hover:bg-surface">
                    <Users className="w-3.5 h-3.5" /> Membres
                  </button>
                  <Link href={`/jury/session/${s.id}`}
                    className="flex items-center gap-1 text-[11px] font-bold text-cama border border-cama/30 rounded-lg px-2.5 py-1.5 hover:bg-cama/5">
                    Ouvrir <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {membersFor === s.id && (
                  <div className="px-3 pb-3 bg-surface/50">
                    <div className="border border-border rounded-lg bg-white p-3">
                      {members.length === 0 ? (
                        <p className="text-[11px] text-muted mb-2">Aucun membre pour l&apos;instant.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {members.map((m) => (
                            <span key={m.id} className="inline-flex items-center gap-1.5 text-[11px] bg-surface border border-border rounded-full px-2.5 py-1">
                              <span className="font-bold text-ink">
                                {m.user ? `${m.user.first_name} ${m.user.last_name}` : m.user_id?.slice(0, 8)}
                              </span>
                              <span className="text-muted">{ROLE_LABEL[m.role_in_jury] ?? m.role_in_jury}</span>
                              {s.status === "ouvert" && (
                                <button onClick={() => delMember(m.id)} className="text-red-400 hover:text-red-600">
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                      {s.status === "ouvert" && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <select value={mUser} onChange={(e) => setMUser(e.target.value)}
                            className="border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cama bg-white min-w-[200px]">
                            <option value="">— Choisir un membre —</option>
                            {staffOptions.map((u) => (
                              <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                            ))}
                          </select>
                          <select value={mRole} onChange={(e) => setMRole(e.target.value)}
                            className="border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cama bg-white">
                            {ROLES_JURY.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </select>
                          <button onClick={addMember} disabled={!mUser}
                            className="flex items-center gap-1 text-[11px] font-bold text-cama border border-cama/30 rounded-lg px-2.5 py-1.5 hover:bg-cama/5 disabled:opacity-50">
                            <UserPlus className="w-3.5 h-3.5" /> Ajouter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </PageShell>
  );
}
