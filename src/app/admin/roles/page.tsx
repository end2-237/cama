"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Search, Crown, Image as ImageIcon, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import { fetchUsers } from "@/lib/admin";
import { fetchProgram } from "@/lib/program";
import {
  ADMIN_LEVELS, levelMeta, setAdminLevel, setMediaManager, can, logAudit, userName,
} from "@/lib/governance";
import type { DBUser, AdminLevel, DBProgramCourse } from "@/lib/supabase";

export default function AdminRolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<DBUser[]>([]);
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [me, setMe] = useState<DBUser | null>(null);
  const [q, setQ] = useState("");
  const [fetching, setFetching] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = async () => {
    const [us, cs] = await Promise.all([fetchUsers(), fetchProgram()]);
    setUsers(us);
    setCourses(cs);
    setMe(us.find((u) => u.id === user?.id) ?? null);
    setFetching(false);
  };
  useEffect(() => { if (user) reload(); /* eslint-disable-next-line */ }, [user]);

  const parcours = useMemo(() => {
    const m = new Map<string, string>();
    courses.forEach((c) => m.set(c.parcours_slug, c.parcours_title));
    return Array.from(m.entries());
  }, [courses]);

  const canManage = me ? can(me, "manage_admins") : false;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter((u) =>
      (u.role === "admin" || u.admin_level || u.is_media_manager || !s ? true : true) &&
      (!s || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(s)),
    );
  }, [users, q]);

  const changeLevel = async (u: DBUser, level: AdminLevel | null) => {
    if (!canManage) return;
    setSavingId(u.id);
    await setAdminLevel(u.id, level, level === "coordinateur" ? u.admin_scope : []);
    await logAudit({ actorId: user!.id, actorName: user!.name, action: "role.admin_level",
      entity: `user:${u.id}`, detail: `${userName(u)} → ${level ?? "aucun"}`, severity: "warn" });
    await reload();
    setSavingId(null);
  };

  const toggleScope = async (u: DBUser, slug: string) => {
    if (!canManage) return;
    const next = u.admin_scope.includes(slug)
      ? u.admin_scope.filter((s) => s !== slug)
      : [...u.admin_scope, slug];
    setSavingId(u.id);
    await setAdminLevel(u.id, u.admin_level, next);
    await reload();
    setSavingId(null);
  };

  const toggleMedia = async (u: DBUser) => {
    if (!canManage) return;
    setSavingId(u.id);
    await setMediaManager(u.id, !u.is_media_manager);
    await logAudit({ actorId: user!.id, actorName: user!.name, action: "role.media_manager",
      entity: `user:${u.id}`, detail: `${userName(u)} → ${!u.is_media_manager}`, severity: "warn" });
    await reload();
    setSavingId(null);
  };

  if (loading || fetching || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-6 h-6 animate-spin text-cama" /></div>
  );

  const adminCount = users.filter((u) => u.admin_level).length;
  const coordCount = users.filter((u) => u.admin_level === "coordinateur").length;
  const mediaCount = users.filter((u) => u.is_media_manager).length;

  return (
    <PageShell
      title="Niveaux d'administration"
      subtitle="Attribuez les niveaux d'administration, périmètres de filière et droits média."
      icon={Crown}
      breadcrumb="Niveaux d'administration"
      maxWidth="max-w-[1100px]"
      stats={[
        { label: "Comptes admin",  value: adminCount, accent: "cama" },
        { label: "Coordinateurs",  value: coordCount, accent: "gold" },
        { label: "Gestion média",  value: mediaCount, accent: "ink" },
        { label: "Utilisateurs",   value: users.length, accent: "ink" },
      ]}
    >
      <div className="space-y-4">
        {/* Explication de la hiérarchie */}
        <div className="grid sm:grid-cols-3 gap-2">
          {ADMIN_LEVELS.map((l) => (
            <div key={l.id} className="bg-white border border-border p-3">
              <p className="text-xs font-black text-ink uppercase tracking-wide">{l.label}</p>
              <p className="text-[11px] text-muted mt-0.5">{l.academic}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-subtle">
          La gestion des étudiants est forte au niveau <strong>coordinateur</strong> (par filière) et la gouvernance globale s&apos;étend jusqu&apos;au <strong>super administrateur</strong> (rectorat).
        </p>

        {!canManage && (
          <div className="bg-gold/10 border border-gold/30 p-3 text-xs text-gold-dark">
            Seul un <strong>super administrateur</strong> peut attribuer les niveaux d&apos;administration. Vue en lecture seule.
          </div>
        )}

        {/* Recherche */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-2 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un utilisateur…"
            className="w-full text-xs pl-7 pr-2 py-2 border border-border bg-white outline-none focus:border-cama" />
        </div>

        {/* Liste */}
        <div className="bg-white border border-border divide-y divide-border">
          {filtered.map((u) => {
            const lvl = levelMeta(u.admin_level);
            return (
              <div key={u.id} className="p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: u.avatar_color || "#4F46E5" }}>
                    {(u.first_name[0] ?? "") + (u.last_name[0] ?? "")}
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-sm font-bold text-ink">{userName(u)}</p>
                    <p className="text-[10px] text-muted">{u.email} · {u.role}{lvl ? ` · ${lvl.label}` : ""}</p>
                  </div>

                  {/* Niveau d'admin */}
                  <select value={u.admin_level ?? ""} disabled={!canManage || savingId === u.id}
                    onChange={(e) => changeLevel(u, (e.target.value || null) as AdminLevel | null)}
                    className="text-xs border-2 border-border px-2 py-1.5 outline-none bg-white disabled:opacity-50">
                    <option value="">— Aucun —</option>
                    {ADMIN_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>

                  {/* Media manager */}
                  <button onClick={() => toggleMedia(u)} disabled={!canManage || savingId === u.id}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 border-2 transition-colors disabled:opacity-50 ${
                      u.is_media_manager ? "border-cama bg-cama-50 text-cama" : "border-border text-muted"}`}>
                    <ImageIcon className="w-3 h-3" /> Média
                  </button>
                </div>

                {/* Périmètre filières pour un coordinateur */}
                {u.admin_level === "coordinateur" && (
                  <div className="mt-2 pl-11">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Filières coordonnées</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parcours.map(([slug, title]) => (
                        <button key={slug} onClick={() => toggleScope(u, slug)} disabled={!canManage || savingId === u.id}
                          className={`text-[10px] font-bold px-2 py-1 border transition-colors disabled:opacity-50 ${
                            u.admin_scope.includes(slug) ? "border-cama bg-cama text-white" : "border-border text-muted hover:border-cama/40"}`}>
                          {u.admin_scope.includes(slug) && <Check className="w-2.5 h-2.5 inline mr-0.5" />}{title}
                        </button>
                      ))}
                      {parcours.length === 0 && <span className="text-[10px] text-subtle">Aucune filière au programme.</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="p-6 text-center text-xs text-muted">Aucun utilisateur.</p>}
        </div>

        <p className="text-[10px] text-subtle flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Chaque changement de niveau est tracé dans le journal d&apos;audit.</p>
      </div>
    </PageShell>
  );
}
