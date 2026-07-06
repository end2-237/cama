"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, FolderOpen, Folder, Upload, FileText, Trash2, ImageIcon,
  CheckCircle2, XCircle, Clock, ExternalLink, ChevronDown, X, Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import {
  DOC_KINDS, docKindLabel, fetchDocuments, uploadStudentDocument,
  deleteDocument, type DBStudentDocument, type DocKind,
} from "@/lib/documents";

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  depose: { label: "Déposé", cls: "bg-gold/10 text-gold-dark border-gold/40", icon: Clock },
  valide: { label: "Validé", cls: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  refuse: { label: "Refusé", cls: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
};

const REQUIRED_KINDS = DOC_KINDS.filter((k) => k.id !== "autre");

/* Regroupement des pièces en « dossiers » (comme un gestionnaire de fichiers) */
const FOLDERS: { id: string; label: string; kinds: DocKind[] }[] = [
  { id: "identite", label: "Identité",           kinds: ["acte_naissance", "cni", "photo"] },
  { id: "diplomes", label: "Diplômes & relevés", kinds: ["diplome", "releve_anterieur"] },
  { id: "autres",   label: "Autres pièces",      kinds: ["autre"] },
];

const isImage = (url?: string | null) => !!url && /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);

export default function DossierEtudiantPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DBStudentDocument[]>([]);
  const [fetching, setFetching] = useState(true);
  const [kind, setKind] = useState<DocKind>("acte_naissance");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "etudiant")) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => { setDocs(await fetchDocuments(user.id)); setFetching(false); })();
  }, [user]);

  const completion = useMemo(() => {
    const validated = new Set(docs.filter((d) => d.status === "valide").map((d) => d.kind));
    const done = REQUIRED_KINDS.filter((k) => validated.has(k.id)).length;
    return { done, total: REQUIRED_KINDS.length, pct: Math.round((done / REQUIRED_KINDS.length) * 100) };
  }, [docs]);

  const pending = docs.filter((d) => d.status === "depose").length;
  const refused = docs.filter((d) => d.status === "refuse").length;

  const visibleDocs = useMemo(() => {
    if (!activeFolder) return docs;
    const kinds = FOLDERS.find((f) => f.id === activeFolder)?.kinds ?? [];
    return docs.filter((d) => kinds.includes(d.kind as DocKind));
  }, [docs, activeFolder]);

  const recent = useMemo(
    () => [...docs].sort((a, b) => +new Date(b.uploaded_at) - +new Date(a.uploaded_at)).slice(0, 4),
    [docs],
  );

  const handleUpload = async () => {
    if (!user || !file || uploading) return;
    setUploading(true); setError(null);
    const res = await uploadStudentDocument(user.id, kind, file);
    if ("error" in res) setError(res.error);
    else {
      setDocs((d) => [res, ...d]);
      setFile(null); setShowUpload(false);
      if (fileInput.current) fileInput.current.value = "";
    }
    setUploading(false);
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

  return (
    <PageShell
      title="Mon dossier administratif"
      subtitle="Déposez et suivez vos pièces justificatives — vérifiées par l'administration."
      icon={FolderOpen}
      breadcrumb="Mon dossier"
      context={`Dossier complet à ${completion.pct}%`}
      actions={
        <button onClick={() => setShowUpload((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Déposer une pièce
        </button>
      }
      stats={[
        { label: "Complétion", value: `${completion.pct}%`, accent: "cama", hint: `${completion.done}/${completion.total} validées` },
        { label: "Pièces",     value: docs.length,           accent: "ink" },
        { label: "En attente", value: pending,               accent: "gold" },
        { label: "Refusées",   value: refused,               accent: refused ? "ink" : "green" },
      ]}
    >
      {fetching ? (
        <div className="py-24 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
      ) : (
        <div className="space-y-5">

          {/* Panneau de dépôt (repliable) */}
          {showUpload && (
            <div className="bg-white border border-border p-4 animate-scale-in">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cama" /> Déposer une pièce
                </p>
                <button onClick={() => setShowUpload(false)} className="text-muted hover:text-ink"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-[220px_1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Type de pièce</label>
                  <select value={kind} onChange={(e) => setKind(e.target.value as DocKind)}
                    className="w-full border border-border bg-surface text-xs text-ink px-2 py-2 focus:outline-none focus:border-cama">
                    {DOC_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Fichier</label>
                  <input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full text-[11px] text-ink border border-border bg-surface px-2 py-1.5 file:mr-2 file:border-0 file:bg-cama file:text-white file:text-[10px] file:font-black file:uppercase file:px-2 file:py-1" />
                </div>
                <button onClick={handleUpload} disabled={!file || uploading}
                  className="inline-flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors disabled:opacity-50">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? "Envoi…" : "Déposer"}
                </button>
              </div>
              {error && <p className="text-[10px] text-red-600 mt-2">{error}</p>}
            </div>
          )}

          {/* Accès rapide : Dossiers + Fichiers récents */}
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
            {/* Dossiers */}
            <div className="bg-white border border-border">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-ink">Dossiers</p>
                {activeFolder && (
                  <button onClick={() => setActiveFolder(null)} className="text-[10px] font-bold text-cama hover:underline">Tout afficher</button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
                {FOLDERS.map((f) => {
                  const count = docs.filter((d) => f.kinds.includes(d.kind as DocKind)).length;
                  const valid = docs.filter((d) => f.kinds.includes(d.kind as DocKind) && d.status === "valide").length;
                  const active = activeFolder === f.id;
                  return (
                    <button key={f.id} onClick={() => setActiveFolder(active ? null : f.id)}
                      className={`text-left bg-white p-4 hover:bg-cama-50 transition-colors ${active ? "ring-2 ring-inset ring-cama" : ""}`}>
                      <div className="w-10 h-10 flex items-center justify-center mb-3" style={{ background: active ? "#4F46E5" : "#EEF2FF" }}>
                        <Folder className={`w-5 h-5 ${active ? "text-white" : "text-cama"}`} />
                      </div>
                      <p className="text-[12px] font-bold text-ink leading-tight">{f.label}</p>
                      <p className="text-[10px] text-muted mt-0.5">{count} pièce{count > 1 ? "s" : ""} · {valid} validée{valid > 1 ? "s" : ""}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fichiers récents */}
            <div className="bg-white border border-border">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-ink">Récemment déposés</p>
              </div>
              {recent.length === 0 ? (
                <p className="px-4 py-8 text-center text-[11px] text-muted">Aucun fichier pour l&apos;instant.</p>
              ) : (
                <div className="p-3 grid grid-cols-2 gap-2">
                  {recent.map((d) => (
                    <a key={d.id} href={d.url} target="_blank" rel="noreferrer"
                      className="border border-border p-2.5 hover:border-cama/40 hover:bg-cama-50/40 transition-colors group">
                      <div className="w-8 h-8 bg-cama-50 flex items-center justify-center mb-2 group-hover:bg-cama transition-colors">
                        {isImage(d.url) ? <ImageIcon className="w-4 h-4 text-cama group-hover:text-white" /> : <FileText className="w-4 h-4 text-cama group-hover:text-white" />}
                      </div>
                      <p className="text-[11px] font-bold text-ink truncate leading-tight">{docKindLabel(d.kind)}</p>
                      <p className="text-[9px] text-muted truncate">{d.size_mo != null ? `${d.size_mo} Mo · ` : ""}{new Date(d.uploaded_at).toLocaleDateString("fr-FR")}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table des pièces */}
          <div className="bg-white border border-border">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cama" />
                {activeFolder ? FOLDERS.find((f) => f.id === activeFolder)?.label : "Toutes mes pièces"}
              </p>
              <span className="text-[9px] font-bold text-white bg-cama px-2 py-0.5">{visibleDocs.length}</span>
            </div>

            {/* En-tête de colonnes */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_130px_110px_40px] gap-2 px-4 py-2 border-b border-border bg-surface text-[9px] font-black uppercase tracking-widest text-muted">
              <span>Nom</span><span>Taille</span><span>Statut</span><span>Date</span><span />
            </div>

            {visibleDocs.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <FolderOpen className="w-7 h-7 text-muted mx-auto mb-2" />
                <p className="text-[11px] font-bold text-ink">Aucune pièce ici</p>
                <p className="text-[10px] text-muted">Utilisez « Déposer une pièce » pour ajouter vos justificatifs.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visibleDocs.map((d) => {
                  const b = STATUS_BADGE[d.status] ?? STATUS_BADGE.depose;
                  const Icon = b.icon;
                  const open = openRow === d.id;
                  return (
                    <div key={d.id}>
                      <button onClick={() => setOpenRow(open ? null : d.id)}
                        className="w-full text-left grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_130px_110px_40px] gap-2 items-center px-4 py-3 hover:bg-surface transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-cama-50 flex items-center justify-center flex-shrink-0">
                            {isImage(d.url) ? <ImageIcon className="w-4 h-4 text-cama" /> : <FileText className="w-4 h-4 text-cama" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-ink truncate">{docKindLabel(d.kind)}</p>
                            <p className="text-[10px] text-muted truncate">{d.title ?? "Document"}</p>
                          </div>
                        </div>
                        <span className="hidden sm:block text-[11px] text-muted">{d.size_mo != null ? `${d.size_mo} Mo` : "—"}</span>
                        <span className={`hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-1 border w-fit ${b.cls}`}>
                          <Icon className="w-3 h-3" /> {b.label}
                        </span>
                        <span className="hidden sm:block text-[11px] text-muted">{new Date(d.uploaded_at).toLocaleDateString("fr-FR")}</span>
                        <ChevronDown className={`w-4 h-4 text-muted justify-self-end transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>

                      {/* Aperçu déplié */}
                      {open && (
                        <div className="px-4 pb-4 pt-1 bg-surface/60 animate-scale-in">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-56 flex-shrink-0 border border-border bg-white p-2">
                              {isImage(d.url) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={d.url} alt={docKindLabel(d.kind)} className="w-full h-40 object-cover" />
                              ) : (
                                <div className="w-full h-40 flex flex-col items-center justify-center text-muted">
                                  <FileText className="w-8 h-8 mb-1" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Document</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] mb-3">
                                <p className="text-muted">Type</p><p className="text-ink font-bold">{docKindLabel(d.kind)}</p>
                                <p className="text-muted">Statut</p>
                                <p><span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 border ${b.cls}`}><Icon className="w-3 h-3" />{b.label}</span></p>
                                <p className="text-muted">Déposé le</p><p className="text-ink">{new Date(d.uploaded_at).toLocaleString("fr-FR")}</p>
                                <p className="text-muted">Taille</p><p className="text-ink">{d.size_mo != null ? `${d.size_mo} Mo` : "—"}</p>
                              </div>
                              {d.status === "refuse" && d.note_admin && (
                                <p className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-1.5 mb-3">
                                  Note de l&apos;administration : {d.note_admin}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <a href={d.url} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-cama/30 text-cama px-3 py-2 hover:bg-cama-50 transition-colors">
                                  <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                                </a>
                                {d.status !== "valide" && (
                                  <button onClick={() => handleDelete(d.id)}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-red-200 text-red-600 px-3 py-2 hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
