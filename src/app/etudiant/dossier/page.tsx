"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, FolderOpen, Upload, FileText, Trash2,
  CheckCircle2, XCircle, Clock, ExternalLink, Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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

export default function DossierEtudiantPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DBStudentDocument[]>([]);
  const [fetching, setFetching] = useState(true);
  const [kind, setKind] = useState<DocKind>("acte_naissance");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "etudiant")) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setDocs(await fetchDocuments(user.id));
      setFetching(false);
    })();
  }, [user]);

  const completion = useMemo(() => {
    const validatedKinds = new Set(docs.filter((d) => d.status === "valide").map((d) => d.kind));
    const done = REQUIRED_KINDS.filter((k) => validatedKinds.has(k.id)).length;
    return { done, total: REQUIRED_KINDS.length, pct: Math.round((done / REQUIRED_KINDS.length) * 100) };
  }, [docs]);

  const handleUpload = async () => {
    if (!user || !file || uploading) return;
    setUploading(true);
    setError(null);
    const res = await uploadStudentDocument(user.id, kind, file);
    if ("error" in res) {
      setError(res.error);
    } else {
      setDocs((d) => [res, ...d]);
      setFile(null);
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
    <div className="min-h-screen bg-surface">
      {/* Top header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1000px] mx-auto px-4 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-[11px] text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-[11px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-cama" /> Mon dossier administratif
          </span>
        </div>
      </header>

      {fetching ? (
        <div className="py-32 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
      ) : (
        <div className="max-w-[1000px] mx-auto px-4 py-4 space-y-4">
          {/* Jauge dossier complet */}
          <div className="bg-white border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Dossier complet à</p>
              <p className="text-[18px] font-black text-cama">{completion.pct}%</p>
            </div>
            <div className="h-2 bg-surface border border-border overflow-hidden">
              <div className="h-full bg-cama transition-all" style={{ width: `${completion.pct}%` }} />
            </div>
            <p className="text-[10px] text-muted mt-2">
              {completion.done}/{completion.total} pièces requises validées par l&apos;administration.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {REQUIRED_KINDS.map((k) => {
                const validated = docs.some((d) => d.kind === k.id && d.status === "valide");
                const pending = !validated && docs.some((d) => d.kind === k.id && d.status === "depose");
                return (
                  <span key={k.id} className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 border ${
                    validated ? "bg-green-50 text-green-700 border-green-200"
                    : pending ? "bg-gold/10 text-gold-dark border-gold/40"
                    : "bg-surface text-muted border-border"}`}>
                    {k.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-[320px_1fr] gap-4 items-start">
            {/* Formulaire de dépôt */}
            <div className="bg-white border border-border p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink mb-3 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cama" /> Déposer une pièce
              </p>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Type de pièce</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as DocKind)}
                className="w-full border border-border bg-surface text-xs text-ink px-2 py-2 mb-3 focus:outline-none focus:border-cama"
              >
                {DOC_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Fichier</label>
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-[11px] text-ink border border-border bg-surface px-2 py-2 mb-3 file:mr-2 file:border-0 file:bg-cama file:text-white file:text-[10px] file:font-black file:uppercase file:px-2 file:py-1"
              />
              {error && <p className="text-[10px] text-red-600 mb-2">{error}</p>}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-4 py-2.5 hover:bg-cama-700 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? "Envoi..." : "Déposer"}
              </button>
              <p className="text-[9px] text-muted mt-3 flex items-start gap-1">
                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                Formats acceptés : PDF, JPG, PNG. Chaque pièce est vérifiée par l&apos;administration.
              </p>
            </div>

            {/* Liste des pièces */}
            <div className="bg-white border border-border">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cama" /> Mes pièces déposées
                </p>
                <span className="text-[9px] font-bold text-white bg-cama px-2 py-0.5">{docs.length}</span>
              </div>
              {docs.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <FolderOpen className="w-6 h-6 text-muted mx-auto mb-2" />
                  <p className="text-[11px] font-bold text-ink">Aucune pièce déposée</p>
                  <p className="text-[10px] text-muted">Utilisez le formulaire pour déposer vos pièces justificatives.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {docs.map((d) => {
                    const b = STATUS_BADGE[d.status] ?? STATUS_BADGE.depose;
                    const Icon = b.icon;
                    return (
                      <div key={d.id} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-cama-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-cama" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-ink truncate">{docKindLabel(d.kind)}</p>
                            <p className="text-[9px] text-muted truncate">
                              {d.title ?? "Document"}{d.size_mo != null ? ` — ${d.size_mo} Mo` : ""} — {new Date(d.uploaded_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-1 border flex-shrink-0 ${b.cls}`}>
                            <Icon className="w-3 h-3" /> {b.label}
                          </span>
                          <a href={d.url} target="_blank" rel="noreferrer" className="text-cama hover:text-cama-700 flex-shrink-0" title="Ouvrir">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {d.status !== "valide" && (
                            <button onClick={() => handleDelete(d.id)} className="text-muted hover:text-red-600 flex-shrink-0" title="Supprimer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {d.status === "refuse" && d.note_admin && (
                          <p className="mt-2 ml-12 text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-1.5">
                            Note de l&apos;administration : {d.note_admin}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
