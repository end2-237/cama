"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Plus, Trash2, UserPlus, UserMinus, ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import {
  fetchCohorts, createCohort, deleteCohort,
  fetchCohortMembers, addCohortMember, removeCohortMember, cohortMembersCount,
  fetchYears, type DBCohort, type DBAcademicYear,
} from "@/lib/academic";
import { fetchProgram } from "@/lib/program";
import { fetchUsers, fetchInscriptions, type InscriptionWithUser } from "@/lib/admin";
import type { DBUser } from "@/lib/supabase";
import { logAudit } from "@/lib/governance";

const LEVELS = ["L1", "L2", "L3", "M1", "M2"];

interface Filiere { slug: string; title: string; }

export default function AdminPromotionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [cohorts, setCohorts] = useState<DBCohort[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [years, setYears] = useState<DBAcademicYear[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [inscriptions, setInscriptions] = useState<InscriptionWithUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulaire nouvelle cohorte
  const [slug, setSlug] = useState("");
  const [level, setLevel] = useState("");
  const [year, setYear] = useState("");
  const [label, setLabel] = useState("");
  const [labelTouched, setLabelTouched] = useState(false);

  // Cohorte ouverte pour la gestion des membres
  const [openId, setOpenId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = async () => {
    const [cs, cnt, program, ys, us, ins] = await Promise.all([
      fetchCohorts(), cohortMembersCount(), fetchProgram(), fetchYears(), fetchUsers(), fetchInscriptions(),
    ]);
    setCohorts(cs);
    setCounts(cnt);
    // Filières distinctes depuis le programme
    const seen = new Map<string, string>();
    program.forEach((p) => { if (!seen.has(p.parcours_slug)) seen.set(p.parcours_slug, p.parcours_title); });
    setFilieres(Array.from(seen).map(([s, t]) => ({ slug: s, title: t })));
    setYears(ys);
    setUsers(us);
    setInscriptions(ins);
    setFetching(false);
  };
  useEffect(() => { if (user) reload(); }, [user]);

  // Libellé auto-suggéré depuis filière + niveau + année
  const suggestedLabel = useMemo(() => {
    const f = filieres.find((x) => x.slug === slug);
    const parts = [level, f?.title, year].filter(Boolean);
    return parts.join(" ");
  }, [filieres, slug, level, year]);

  useEffect(() => {
    if (!labelTouched) setLabel(suggestedLabel);
  }, [suggestedLabel, labelTouched]);

  const addCohort = async () => {
    const finalLabel = (label.trim() || suggestedLabel).trim();
    if (!finalLabel || saving) return;
    setSaving(true);
    const f = filieres.find((x) => x.slug === slug);
    await createCohort({
      label: finalLabel,
      parcoursSlug: slug || null,
      parcoursTitle: f?.title ?? null,
      academicYear: year || null,
      level: level || null,
      createdBy: user!.id,
    });
    await logAudit({ actorId: user!.id, actorName: user!.name, action: "cohorte.creer",
      entity: "cohorte", detail: `Cohorte créée · ${finalLabel}`, severity: "info" });
    setSlug(""); setLevel(""); setYear(""); setLabel(""); setLabelTouched(false);
    await reload();
    setSaving(false);
  };

  const removeCohort = async (c: DBCohort) => {
    if (saving) return;
    setSaving(true);
    await deleteCohort(c.id);
    await logAudit({ actorId: user!.id, actorName: user!.name, action: "cohorte.creer",
      entity: `cohorte:${c.id}`, detail: `Cohorte supprimée · ${c.label}`, severity: "warn" });
    if (openId === c.id) setOpenId(null);
    await reload();
    setSaving(false);
  };

  const openCohort = async (c: DBCohort) => {
    setOpenId(c.id);
    const members = await fetchCohortMembers(c.id);
    setMemberIds(new Set(members.map((m) => m.student_id)));
  };

  const toggleMember = async (studentId: string, present: boolean) => {
    if (!openId || saving) return;
    setSaving(true);
    if (present) {
      await removeCohortMember(openId, studentId);
      setMemberIds((s) => { const n = new Set(s); n.delete(studentId); return n; });
    } else {
      await addCohortMember(openId, studentId);
      setMemberIds((s) => new Set(s).add(studentId));
    }
    await logAudit({ actorId: user!.id, actorName: user!.name, action: "cohorte.membre",
      entity: `cohorte:${openId}`, detail: `${present ? "Retrait" : "Ajout"} étudiant ${studentId}`, severity: "info" });
    setCounts((c) => ({ ...c, [openId]: (c[openId] ?? 0) + (present ? -1 : 1) }));
    setSaving(false);
  };

  if (loading || fetching || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-6 h-6 animate-spin text-cama" /></div>
  );

  const openCohortObj = cohorts.find((c) => c.id === openId) ?? null;
  const totalGrouped = Object.values(counts).reduce((a, n) => a + n, 0);

  // Étudiants candidats — pré-filtrés par la filière de la cohorte ouverte si connue
  const studentUsers = users.filter((u) => u.role === "etudiant");
  const insByUser = new Map<string, InscriptionWithUser>();
  inscriptions.forEach((i) => { if (!insByUser.has(i.user_id)) insByUser.set(i.user_id, i); });

  let candidates = studentUsers;
  if (openCohortObj?.parcours_slug) {
    const inSlug = new Set(inscriptions
      .filter((i) => i.parcours_slug === openCohortObj.parcours_slug)
      .map((i) => i.user_id));
    candidates = studentUsers.filter((u) => inSlug.has(u.id));
  }

  return (
    <PageShell
      title="Promotions & cohortes"
      subtitle="Regroupez les étudiants d'une filière et d'une année (ex. « L3 GL 2025-2026 »)."
      icon={Users}
      breadcrumb="Promotions & cohortes"
      maxWidth="max-w-[1100px]"
      stats={[
        { label: "Cohortes",            value: cohorts.length, accent: "cama" },
        { label: "Étudiants regroupés", value: totalGrouped,   accent: "gold" },
        { label: "Filières",            value: filieres.length, accent: "ink" },
      ]}
    >
      <div className="space-y-4">
        {/* Nouvelle cohorte */}
        <div className="bg-white border border-border p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Nouvelle cohorte</p>
          <div className="flex flex-wrap items-center gap-2">
            <select value={level} onChange={(e) => setLevel(e.target.value)}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama">
              <option value="">Niveau…</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={slug} onChange={(e) => setSlug(e.target.value)}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama max-w-[220px]">
              <option value="">Filière…</option>
              {filieres.map((f) => <option key={f.slug} value={f.slug}>{f.title}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama">
              <option value="">Année…</option>
              {years.map((y) => <option key={y.id} value={y.label}>{y.label}</option>)}
            </select>
            <input value={label} onChange={(e) => { setLabel(e.target.value); setLabelTouched(true); }}
              placeholder="Libellé (auto)"
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama w-48" />
            <button onClick={addCohort} disabled={!(label.trim() || suggestedLabel) || saving}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white bg-cama px-3 py-2 disabled:opacity-50">
              <Plus className="w-3 h-3" /> Créer
            </button>
          </div>
        </div>

        {/* Vue liste OU vue gestion des membres */}
        {!openCohortObj && (
          <>
            {cohorts.length === 0 && (
              <div className="bg-white border border-border p-6 text-center text-xs text-muted">Aucune cohorte.</div>
            )}
            {cohorts.map((c) => (
              <div key={c.id} className="bg-white border border-border p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                    {c.label}
                    {c.level && <span className="text-[9px] font-black uppercase tracking-widest text-cama border border-cama px-1.5 py-0.5">{c.level}</span>}
                  </p>
                  <p className="text-[10px] text-muted">
                    {c.parcours_title ?? "Toutes filières"}{c.academic_year ? ` · ${c.academic_year}` : ""} · {counts[c.id] ?? 0} étudiant{(counts[c.id] ?? 0) > 1 ? "s" : ""}
                  </p>
                </div>
                <button onClick={() => openCohort(c)}
                  className="flex items-center gap-1 text-[10px] font-bold text-cama border border-cama px-2 py-1.5 hover:bg-cama-50 transition-colors">
                  <Users className="w-3 h-3" /> Gérer les membres
                </button>
                <button onClick={() => removeCohort(c)} disabled={saving}
                  className="flex items-center gap-1 text-[10px] font-bold text-red-600 border border-border px-2 py-1.5 hover:border-red-300 transition-colors disabled:opacity-50">
                  <Trash2 className="w-3 h-3" /> Supprimer
                </button>
              </div>
            ))}
          </>
        )}

        {openCohortObj && (
          <div className="bg-white border border-border">
            <div className="flex items-center gap-3 p-3 border-b border-border flex-wrap">
              <button onClick={() => setOpenId(null)}
                className="flex items-center gap-1 text-[10px] font-bold text-muted border border-border px-2 py-1.5 hover:border-cama/40 transition-colors">
                <ChevronLeft className="w-3 h-3" /> Retour
              </button>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{openCohortObj.label}</p>
                <p className="text-[10px] text-muted">
                  {openCohortObj.parcours_title ?? "Toutes filières"} · {memberIds.size} membre{memberIds.size > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {candidates.length === 0 && (
                <p className="p-6 text-center text-xs text-muted">Aucun étudiant candidat.</p>
              )}
              {candidates.map((u) => {
                const present = memberIds.has(u.id);
                const ins = insByUser.get(u.id);
                return (
                  <div key={u.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink truncate">{u.first_name} {u.last_name}</p>
                      <p className="text-[10px] text-muted truncate">
                        {u.email}{ins ? ` · ${ins.parcours_title} · ${ins.level}` : ""}
                      </p>
                    </div>
                    <button onClick={() => toggleMember(u.id, present)} disabled={saving}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 border transition-colors disabled:opacity-50 ${
                        present ? "border-cama bg-cama text-white" : "border-border text-muted hover:border-cama/40"}`}>
                      {present ? <><UserMinus className="w-3 h-3" /> Retirer</> : <><UserPlus className="w-3 h-3" /> Ajouter</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-subtle">Chaque création de cohorte et modification de membre est tracée dans le journal d&apos;audit.</p>
      </div>
    </PageShell>
  );
}
