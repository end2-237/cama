"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, FolderOpen, Upload, FileText, Trash2, ImageIcon,
  CheckCircle2, XCircle, Clock, ExternalLink, ShieldCheck, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import {
  DOC_KINDS, fetchDocuments, uploadStudentDocument,
  deleteDocument, type DBStudentDocument, type DocKind,
} from "@/lib/documents";

const STATUS: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  depose: { label: "En attente", cls: "bg-gold/10 text-gold-dark border-gold/40", icon: Clock },
  valide: { label: "Validé",     cls: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  refuse: { label: "Refusé",     cls: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
};

const REQUIRED_KINDS = DOC_KINDS.filter((k) => k.id !== "autre");
const isImage = (url?: string | null) => !!url && /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);

export default function DossierEtudiantPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DBStudentDocument[]>([]);
  const [fetching, setFetching] = useState(true);
  const [pendingKind, setPendingKind] = useState<DocKind | null>(null);
  const [uploadingKind, setUploadingKind] = useState<DocKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "etudiant")) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => { setDocs(await fetchDocuments(user.id)); setFetching(false); })();
  }, [user]);

  const byKind = useMemo(() => {
    const m = new Map<string, DBStudentDocument>();
    // le plus récent gagne (déjà trié desc par fetchDocuments)
    docs.forEach((d) => { if (!m.has(d.kind)) m.set(d.kind, d); });
    return m;
  }, [docs]);

  const completion = useMemo(() => {
    const done = REQUIRED_KINDS.filter((k) => byKind.get(k.id)?.status === "valide").length;
    const submitted = REQUIRED_KINDS.filter((k) => byKind.has(k.id)).length;
    return { done, submitted, total: REQUIRED_KINDS.length, pct: Math.round((done / REQUIRED_KINDS.length) * 100) };
  }, [byKind]);

  const extras = docs.filter((d) => d.kind === "autre");
  const pending = docs.filter((d) => d.status === "depose").length;
  const refused = docs.filter((d) => d.status === "refuse").length;

  const pickFor = (kind: DocKind) => {
    setError(null);
    setPendingKind(kind);
    fileInput.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!user || !f || !pendingKind) return;
    const kind = pendingKind;
    setUploadingKind(kind); setError(null);
    const res = await uploadStudentDocument(user.id, kind, f);
    if ("error" in res) setError(res.error);
    else setDocs((d) => [res, ...d]);
    setUploadingKind(null); setPendingKind(null);
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    setDocs((d) => d.filter((x) => x.id !== id));
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-8 h-8 border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const R = 34, C = 2 * Math.PI * R;

  return (
    <PageShell
      title="Mon dossier administratif"
      subtitle="Déposez vos pièces justificatives — chacune est vérifiée par l'administration."
      icon={FolderOpen}
      breadcrumb="Mon dossier"
      context={`Dossier validé à ${completion.pct}%`}
      stats={[
        { label: "Validées",   value: `${completion.done}/${completion.total}`, accent: "green" },
        { label: "Déposées",   value: docs.length,  accent: "ink" },
        { label: "En attente", value: pending,      accent: "gold" },
        { label: "Refusées",   value: refused,      accent: refused ? "ink" : "green" },
      ]}
    >
      {/* input fichier unique, déclenché par pièce */}
      <input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={onFile} className="hidden" />

      {fetching ? (
        <div className="py-24 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
      ) : (
        <div className="space-y-5">

          {/* Hero — anneau de progression */}
          <div className="bg-white border border-border p-5 flex flex-col sm:flex-row items-center gap-6"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #EEF2FF 100%)" }}>
            <div className="relative flex-shrink-0">
              <svg width="92" height="92" viewBox="0 0 92 92">
                <circle cx="46" cy="46" r={R} fill="none" stroke="#E5E7EB" strokeWidth="9" />
                <circle cx="46" cy="46" r={R} fill="none" stroke="#4F46E5" strokeWidth="9"
                  strokeLinecap="butt" strokeDasharray={C}
                  strokeDashoffset={C * (1 - completion.pct / 100)}
                  transform="rotate(-90 46 46)" style={{ transition: "stroke-dashoffset .6s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-cama leading-none">{completion.pct}%</span>
              </div>
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Avancement du dossier</p>
              <p className="text-lg font-black text-ink mt-0.5">
                {completion.done}/{completion.total} pièces validées
              </p>
              <p className="text-xs text-muted mt-1">
                {completion.done === completion.total
                  ? "Votre dossier est complet et validé. "
                  : `${completion.submitted}/${completion.total} déposées, ${completion.total - completion.done} restantes à faire valider. `}
                L&apos;administration vérifie chaque pièce.
              </p>
            </div>
          </div>

          {/* Pièces requises — dépôt par pièce */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Pièces requises</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {REQUIRED_KINDS.map((k) => {
                const d = byKind.get(k.id);
                const st = d ? (STATUS[d.status] ?? STATUS.depose) : null;
                const busy = uploadingKind === k.id;
                return (
                  <div key={k.id} className={`bg-white border p-4 flex flex-col ${d?.status === "valide" ? "border-green-200" : d?.status === "refuse" ? "border-red-200" : "border-border"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${d?.status === "valide" ? "bg-green-50" : "bg-cama-50"}`}>
                        {d && isImage(d.url) ? <ImageIcon className="w-5 h-5 text-cama" /> : <FileText className={`w-5 h-5 ${d?.status === "valide" ? "text-green-700" : "text-cama"}`} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-ink leading-tight">{k.label}</p>
                        {st ? (
                          <span className={`mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 border ${st.cls}`}>
                            <st.icon className="w-3 h-3" /> {st.label}
                          </span>
                        ) : (
                          <span className="mt-1 inline-block text-[9px] font-black uppercase tracking-wide text-muted">Non déposé</span>
                        )}
                      </div>
                    </div>

                    {d?.status === "refuse" && d.note_admin && (
                      <p className="mt-2 text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-1">{d.note_admin}</p>
                    )}

                    <div className="mt-3 flex items-center gap-1.5">
                      {!d ? (
                        <button onClick={() => pickFor(k.id)} disabled={busy}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-3 py-2 hover:bg-cama-700 transition-colors disabled:opacity-50">
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Déposer
                        </button>
                      ) : (
                        <>
                          <a href={d.url} target="_blank" rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] font-bold text-cama border border-cama/30 px-2 py-2 hover:bg-cama-50 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" /> Voir
                          </a>
                          {d.status !== "valide" && (
                            <>
                              <button onClick={() => pickFor(k.id)} disabled={busy} title="Remplacer"
                                className="inline-flex items-center justify-center border border-border px-2 py-2 text-muted hover:text-cama hover:border-cama/40 transition-colors disabled:opacity-50">
                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => handleDelete(d.id)} title="Supprimer"
                                className="inline-flex items-center justify-center border border-border px-2 py-2 text-muted hover:text-red-600 hover:border-red-200 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {error && <p className="text-[11px] text-red-600 mt-2">{error}</p>}
          </div>

          {/* Pièces complémentaires */}
          <div className="bg-white border border-border">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cama" /> Pièces complémentaires
              </p>
              <button onClick={() => pickFor("autre")} disabled={uploadingKind === "autre"}
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-3 py-1.5 hover:bg-cama-700 transition-colors disabled:opacity-50">
                {uploadingKind === "autre" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Ajouter
              </button>
            </div>
            {extras.length === 0 ? (
              <p className="px-4 py-6 text-center text-[11px] text-muted">Aucune pièce complémentaire. Ajoutez tout justificatif utile.</p>
            ) : (
              <div className="divide-y divide-border">
                {extras.map((d) => {
                  const st = STATUS[d.status] ?? STATUS.depose;
                  return (
                    <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 bg-cama-50 flex items-center justify-center flex-shrink-0">
                        {isImage(d.url) ? <ImageIcon className="w-4 h-4 text-cama" /> : <FileText className="w-4 h-4 text-cama" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-ink truncate">{d.title ?? "Document"}</p>
                        <p className="text-[10px] text-muted">{d.size_mo != null ? `${d.size_mo} Mo · ` : ""}{new Date(d.uploaded_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 border ${st.cls}`}>
                        <st.icon className="w-3 h-3" /> {st.label}
                      </span>
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-cama hover:text-cama-700" title="Ouvrir">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      {d.status !== "valide" && (
                        <button onClick={() => handleDelete(d.id)} className="text-muted hover:text-red-600" title="Supprimer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-[10px] text-subtle flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Formats acceptés : PDF, JPG, PNG. Vos pièces validées ne peuvent plus être supprimées.
          </p>
        </div>
      )}
    </PageShell>
  );
}
