"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, ShieldCheck, Download, Search, ScrollText,
  FileBarChart2, Lock, AlertTriangle, Info, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchAudit, can, levelMeta, type DBAudit } from "@/lib/governance";
import { fetchUsers, fetchInscriptions, type InscriptionWithUser } from "@/lib/admin";
import { fetchDeliberations, type DelibWithMeta } from "@/lib/exams";
import type { DBUser, UserRole } from "@/lib/supabase";

const ROLE_LABELS: Record<UserRole, string> = {
  etudiant: "Étudiant", enseignant: "Enseignant", admin: "Administrateur", jury: "Jury",
};

const SEV_META: Record<DBAudit["severity"], { label: string; cls: string; icon: typeof Info }> = {
  info:     { label: "Info",     cls: "bg-surface text-muted border-border",           icon: Info },
  warn:     { label: "Alerte",   cls: "bg-amber-50 text-amber-700 border-amber-200",   icon: AlertTriangle },
  critical: { label: "Critique", cls: "bg-red-50 text-red-700 border-red-200",         icon: ShieldAlert },
};

// ── Utilitaires CSV ──
function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((c) => {
      const s = String(c ?? "");
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(";"))
    .join("\r\n");
}
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export default function AdminAuditPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [fetching, setFetching] = useState(true);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [audit, setAudit] = useState<DBAudit[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [inscriptions, setInscriptions] = useState<InscriptionWithUser[]>([]);
  const [delibs, setDelibs] = useState<DelibWithMeta[]>([]);

  // Filtres journal
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<"" | DBAudit["severity"]>("");
  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = useCallback(async () => {
    if (!user) return;
    const [au, us, ins, dl] = await Promise.all([
      fetchAudit(300), fetchUsers(), fetchInscriptions(), fetchDeliberations(),
    ]);
    setAudit(au);
    setUsers(us);
    setInscriptions(ins);
    setDelibs(dl);
    setDbUser(us.find((u) => u.id === user.id) ?? null);
    setFetching(false);
  }, [user]);
  useEffect(() => { reload(); }, [reload]);

  // ── Rapports synthétiques ──
  const insByStatus = useMemo(() => ({
    en_attente: inscriptions.filter((i) => i.status === "en_attente").length,
    validee:    inscriptions.filter((i) => i.status === "validee").length,
    rejetee:    inscriptions.filter((i) => i.status === "rejetee").length,
  }), [inscriptions]);

  const usersByRole = useMemo(() => {
    const m: Record<string, number> = {};
    for (const u of users) m[u.role] = (m[u.role] ?? 0) + 1;
    return m;
  }, [users]);

  const delibStats = useMemo(() => {
    const valide = delibs.filter((d) => d.status === "valide");
    return {
      valide: valide.length,
      enAttente: delibs.filter((d) => d.status === "en_delib").length,
      rejete: delibs.filter((d) => d.status === "rejete").length,
      ects: valide.reduce((s, d) => s + (d.credits ?? 0), 0),
    };
  }, [delibs]);

  // ── Journal filtré ──
  const prefixes = useMemo(() => {
    const s = new Set<string>();
    for (const a of audit) s.add(a.action.split(".")[0]);
    return Array.from(s).sort();
  }, [audit]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return audit.filter((a) => {
      if (sev && a.severity !== sev) return false;
      if (prefix && a.action.split(".")[0] !== prefix) return false;
      if (needle) {
        const hay = `${a.actor_name ?? ""} ${a.action} ${a.entity ?? ""} ${a.detail ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [audit, q, sev, prefix]);

  // ── Exports CSV ──
  const exportInscriptions = () => downloadCsv("rapport_inscriptions.csv", [
    ["Statut", "Nombre"],
    ["En attente", insByStatus.en_attente],
    ["Validées", insByStatus.validee],
    ["Rejetées", insByStatus.rejetee],
    ["Total", inscriptions.length],
  ]);
  const exportRoles = () => downloadCsv("rapport_comptes.csv", [
    ["Rôle", "Nombre"],
    ...(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => [ROLE_LABELS[r], usersByRole[r] ?? 0] as [string, number]),
    ["Total", users.length],
  ]);
  const exportDelibs = () => downloadCsv("rapport_deliberations.csv", [
    ["Indicateur", "Valeur"],
    ["Délibérations validées", delibStats.valide],
    ["En délibération", delibStats.enAttente],
    ["Rejetées", delibStats.rejete],
    ["ECTS attribués", delibStats.ects],
  ]);
  const exportAudit = () => downloadCsv("journal_audit.csv", [
    ["Date/heure", "Acteur", "Action", "Entité", "Détail", "Sévérité"],
    ...filtered.map((a) => [
      fmtDate(a.created_at), a.actor_name ?? "—", a.action, a.entity ?? "", a.detail ?? "", a.severity,
    ] as string[]),
  ]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const canAudit = dbUser ? can(dbUser, "view_audit") : false;
  const lvl = dbUser ? levelMeta(dbUser.admin_level) : null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cama" /> Rapports & Audit
          </span>
          <div className="flex-1" />
          {lvl && <span className="text-[10px] font-black uppercase tracking-widest text-cama">{lvl.label}</span>}
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : (
          <>
            {/* ── 1. Rapports synthétiques ── */}
            <section>
              <h2 className="text-xs font-black uppercase tracking-widest text-subtle mb-3 flex items-center gap-1.5">
                <FileBarChart2 className="w-3.5 h-3.5" /> Rapports synthétiques
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ReportCard title="Inscriptions" onExport={exportInscriptions} rows={[
                  ["En attente", insByStatus.en_attente, "text-amber-600"],
                  ["Validées", insByStatus.validee, "text-green-600"],
                  ["Rejetées", insByStatus.rejetee, "text-red-600"],
                ]} total={["Total", inscriptions.length]} />

                <ReportCard title="Comptes par rôle" onExport={exportRoles} rows={
                  (Object.keys(ROLE_LABELS) as UserRole[]).map((r) => [ROLE_LABELS[r], usersByRole[r] ?? 0, "text-ink"] as [string, number, string])
                } total={["Total", users.length]} />

                <ReportCard title="Délibérations & ECTS" onExport={exportDelibs} rows={[
                  ["Validées", delibStats.valide, "text-green-600"],
                  ["En délibération", delibStats.enAttente, "text-amber-600"],
                  ["Rejetées", delibStats.rejete, "text-red-600"],
                ]} total={["ECTS attribués", delibStats.ects]} />
              </div>
            </section>

            {/* ── 2. Journal d'audit ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-subtle flex items-center gap-1.5">
                  <ScrollText className="w-3.5 h-3.5" /> Journal d&apos;audit
                </h2>
                {canAudit && (
                  <button onClick={exportAudit}
                    className="flex items-center gap-1.5 text-xs font-bold text-cama border border-cama/40 px-2.5 py-1 rounded-lg hover:bg-cama/5 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Exporter (CSV)
                  </button>
                )}
              </div>

              {!canAudit ? (
                <div className="bg-white border border-border rounded-xl p-8 text-center">
                  <Lock className="w-8 h-8 text-subtle mx-auto mb-3" />
                  <p className="text-sm font-bold text-ink">Journal d&apos;audit réservé</p>
                  <p className="text-xs text-muted mt-1">
                    La consultation du journal d&apos;audit est réservée aux administrateurs (niveau directeur+).
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  {/* Filtres */}
                  <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="w-4 h-4 text-subtle absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (acteur, action, détail…)"
                        className="w-full border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-cama" />
                    </div>
                    <select value={sev} onChange={(e) => setSev(e.target.value as typeof sev)}
                      className="border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-cama">
                      <option value="">Toutes sévérités</option>
                      <option value="info">Info</option>
                      <option value="warn">Alerte</option>
                      <option value="critical">Critique</option>
                    </select>
                    <select value={prefix} onChange={(e) => setPrefix(e.target.value)}
                      className="border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-cama">
                      <option value="">Toutes actions</option>
                      {prefixes.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <span className="text-xs text-subtle ml-auto">{filtered.length} entrée{filtered.length > 1 ? "s" : ""}</span>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="p-10 text-center text-sm text-muted">
                      Aucune entrée d&apos;audit — les actions sensibles seront tracées ici.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-subtle border-b border-border">
                            <th className="px-3 py-2 whitespace-nowrap">Date / heure</th>
                            <th className="px-3 py-2 whitespace-nowrap">Acteur</th>
                            <th className="px-3 py-2">Action</th>
                            <th className="px-3 py-2">Entité</th>
                            <th className="px-3 py-2">Détail</th>
                            <th className="px-3 py-2 whitespace-nowrap">Sévérité</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((a) => {
                            const sm = SEV_META[a.severity];
                            const SIcon = sm.icon;
                            return (
                              <tr key={a.id} className="border-b border-border/60 hover:bg-surface/60">
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted tabular-nums">{fmtDate(a.created_at)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-ink">{a.actor_name ?? "—"}</td>
                                <td className="px-3 py-2">
                                  <span className="font-mono text-[11px] bg-surface border border-border rounded px-1.5 py-0.5 text-ink">{a.action}</span>
                                </td>
                                <td className="px-3 py-2 text-muted">{a.entity ?? "—"}</td>
                                <td className="px-3 py-2 text-muted max-w-[280px] truncate" title={a.detail ?? ""}>{a.detail ?? "—"}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold border rounded-full px-2 py-0.5 ${sm.cls}`}>
                                    <SIcon className="w-3 h-3" /> {sm.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Note */}
              <p className="text-xs text-subtle mt-3 leading-relaxed">
                Les entrées du journal sont ajoutées automatiquement par les actions sensibles de la plateforme
                — validation d&apos;inscription, changement de rôle ou de niveau d&apos;administration, ouverture
                d&apos;examen, décision de délibération… Elles constituent une trace inaltérable à des fins de
                contrôle et de gouvernance.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ReportCard({
  title, rows, total, onExport,
}: {
  title: string;
  rows: [string, number, string][];
  total: [string, number];
  onExport: () => void;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-ink text-sm">{title}</p>
        <button onClick={onExport}
          className="flex items-center gap-1 text-[11px] font-bold text-cama hover:underline">
          <Download className="w-3 h-3" /> CSV
        </button>
      </div>
      <div className="space-y-1.5 flex-1">
        {rows.map(([label, value, cls]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted">{label}</span>
            <span className={`font-bold tabular-nums ${cls}`}>{value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm border-t border-border mt-3 pt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-subtle">{total[0]}</span>
        <span className="font-black text-ink tabular-nums">{total[1]}</span>
      </div>
    </div>
  );
}
