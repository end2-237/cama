"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, ImageIcon, Video, FileText, Music, Sparkles,
  Plus, Trash2, Pencil, Copy, Check, Upload, Search, Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchUsers } from "@/lib/admin";
import { uploadMedia } from "@/lib/resources";
import {
  fetchMedia, addMedia, updateMedia, deleteMedia,
  type DBMedia, type MediaKind,
} from "@/lib/governance";
import type { DBUser } from "@/lib/supabase";

const KINDS: MediaKind[] = ["image", "video", "logo", "document", "audio"];
const KIND_LABEL: Record<MediaKind, string> = {
  image: "Image", video: "Vidéo", logo: "Logo", document: "Document", audio: "Audio",
};
const KIND_ICON: Record<MediaKind, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon, video: Video, logo: Sparkles, document: FileText, audio: Music,
};
const KIND_TINT: Record<MediaKind, string> = {
  image: "text-emerald-600 bg-emerald-50",
  video: "text-rose-600 bg-rose-50",
  logo: "text-amber-600 bg-amber-50",
  document: "text-sky-600 bg-sky-50",
  audio: "text-violet-600 bg-violet-50",
};

type Draft = { title: string; kind: MediaKind; category: string; description: string; url: string };
const EMPTY_DRAFT: Draft = { title: "", kind: "image", category: "", description: "", url: "" };

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}
function fmtSize(mo: number | null): string {
  if (mo == null) return "—";
  return mo >= 1 ? `${mo.toFixed(1)} Mo` : `${Math.round(mo * 1024)} Ko`;
}

export default function AdminMediaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [items, setItems] = useState<DBMedia[]>([]);
  const [fetching, setFetching] = useState(true);

  const [kindFilter, setKindFilter] = useState<MediaKind | "all">("all");
  const [query, setQuery] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [sizeMo, setSizeMo] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ title: string; category: string; description: string }>({ title: "", category: "", description: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canEdit = dbUser?.is_media_manager === true;

  // Auth + résolution du DBUser complet (is_media_manager)
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/dashboard"); return; }
    let alive = true;
    (async () => {
      const users = await fetchUsers();
      if (!alive) return;
      const me = users.find((u) => u.id === user.id) ?? null;
      setDbUser(me);
      setChecked(true);
      const allowed = user.role === "admin" || me?.is_media_manager === true;
      if (!allowed) router.replace("/dashboard");
    })();
    return () => { alive = false; };
  }, [loading, user, router]);

  const reload = useCallback(async () => {
    setItems(await fetchMedia());
    setFetching(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const k of KINDS) c[k] = 0;
    for (const it of items) c[it.kind] = (c[it.kind] ?? 0) + 1;
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (kindFilter !== "all" && it.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        (it.category ?? "").toLowerCase().includes(q) ||
        (it.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, kindFilter, query]);

  if (loading || !user || !checked) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const allowed = user.role === "admin" || canEdit;
  if (!allowed) return null;

  // ── Upload de fichier ──
  const onFile = async (file: File) => {
    if (!file) return;
    setFormError(null);
    setUploading(true);
    setProgress(0);
    const res = await uploadMedia("media", file, (p) => setProgress(p));
    setUploading(false);
    if ("error" in res) { setFormError(res.error); return; }
    setDraft((d) => ({ ...d, url: res.url, title: d.title || file.name.replace(/\.[^.]+$/, "") }));
    setSizeMo(res.sizeMo);
  };

  const submitAdd = async () => {
    setFormError(null);
    if (!draft.title.trim()) { setFormError("Le titre est requis."); return; }
    if (!draft.url.trim()) { setFormError("Fournissez un fichier téléversé ou une URL."); return; }
    setSaving(true);
    await addMedia({
      title: draft.title.trim(),
      kind: draft.kind,
      category: draft.category.trim() || null,
      url: draft.url.trim(),
      description: draft.description.trim() || null,
      size_mo: sizeMo,
      created_by: user.id,
    });
    setSaving(false);
    setDraft(EMPTY_DRAFT);
    setSizeMo(null);
    setProgress(0);
    setShowAdd(false);
    reload();
  };

  const startEdit = (m: DBMedia) => {
    setEditId(m.id);
    setEditDraft({ title: m.title, category: m.category ?? "", description: m.description ?? "" });
  };
  const saveEdit = async () => {
    if (!editId) return;
    await updateMedia(editId, {
      title: editDraft.title.trim() || "Sans titre",
      category: editDraft.category.trim() || null,
      description: editDraft.description.trim() || null,
    });
    setEditId(null);
    reload();
  };
  const remove = async (m: DBMedia) => {
    if (confirm(`Supprimer « ${m.title} » ?`)) { await deleteMedia(m.id); reload(); }
  };
  const copyUrl = async (m: DBMedia) => {
    try {
      await navigator.clipboard.writeText(m.url);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1500);
    } catch { /* clipboard indisponible */ }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-cama" /> Ressources média du site
          </span>
          <div className="flex-1" />
          <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${canEdit ? "text-cama bg-cama/10" : "text-muted bg-surface border border-border"}`}>
            {canEdit ? "Gestionnaire" : "Lecture seule"}
          </span>
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {!canEdit && (
          <div className="bg-white border border-border rounded-xl p-3 flex items-center gap-2 text-sm text-muted">
            <Lock className="w-4 h-4 text-subtle shrink-0" />
            Seul le gestionnaire des ressources média peut modifier cette section.
          </div>
        )}

        {/* Ajouter un média (collapsible) */}
        {canEdit && (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <button onClick={() => setShowAdd((s) => !s)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-ink hover:bg-surface transition-colors">
              <Plus className={`w-4 h-4 text-cama transition-transform ${showAdd ? "rotate-45" : ""}`} /> Ajouter un média
            </button>
            {showAdd && (
              <div className="border-t border-border p-4 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Titre">
                    <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputCls} placeholder="Logo CAMA — fond clair" />
                  </Field>
                  <Field label="Type">
                    <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as MediaKind })} className={inputCls}>
                      {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                    </select>
                  </Field>
                  <Field label="Catégorie">
                    <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputCls} placeholder="Identité visuelle" />
                  </Field>
                  <Field label="Description">
                    <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={inputCls} placeholder="Usage recommandé…" />
                  </Field>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Téléverser un fichier">
                    <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm text-muted cursor-pointer hover:border-cama hover:text-cama transition-colors">
                      <Upload className="w-4 h-4" /> Choisir un fichier
                      <input type="file" className="hidden" disabled={uploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                    </label>
                  </Field>
                  <Field label="… ou coller une URL">
                    <input value={draft.url} onChange={(e) => { setDraft({ ...draft, url: e.target.value }); setSizeMo(null); }} className={inputCls} placeholder="https://…" />
                  </Field>
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                      <div className="h-full bg-cama transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-muted">Téléversement… {progress}%</p>
                  </div>
                )}
                {!uploading && draft.url && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 truncate">
                    <Check className="w-3.5 h-3.5 shrink-0" /> URL prête{sizeMo != null ? ` · ${fmtSize(sizeMo)}` : ""}
                  </p>
                )}
                {formError && <p className="text-xs text-red-500">{formError}</p>}

                <div className="flex items-center gap-2">
                  <button onClick={submitAdd} disabled={saving || uploading}
                    className="flex items-center gap-2 bg-cama text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-cama/90 transition-colors disabled:opacity-50">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
                  </button>
                  <button onClick={() => { setDraft(EMPTY_DRAFT); setSizeMo(null); setProgress(0); setFormError(null); }}
                    className="text-sm text-muted hover:text-ink px-3 py-2">Réinitialiser</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip label="Tous" count={counts.all} active={kindFilter === "all"} onClick={() => setKindFilter("all")} />
          {KINDS.map((k) => (
            <FilterChip key={k} label={KIND_LABEL[k]} count={counts[k] ?? 0} active={kindFilter === k} onClick={() => setKindFilter(k)} />
          ))}
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…"
              className="w-56 max-w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-cama" />
          </div>
        </div>

        {/* Grille */}
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : visible.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center text-muted text-sm">Aucune ressource média.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((m) => {
              const Icon = KIND_ICON[m.kind];
              const isImg = m.kind === "image" || m.kind === "logo";
              const editing = editId === m.id;
              return (
                <div key={m.id} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col">
                  {/* Vignette */}
                  <div className="aspect-[16/10] bg-surface flex items-center justify-center overflow-hidden border-b border-border">
                    {isImg && m.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt={m.title} className="w-full h-full object-contain" />
                    ) : (
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${KIND_TINT[m.kind]}`}>
                        <Icon className="w-7 h-7" />
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col gap-2">
                    {editing ? (
                      <div className="space-y-2">
                        <input value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} className={inputCls} placeholder="Titre" />
                        <input value={editDraft.category} onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })} className={inputCls} placeholder="Catégorie" />
                        <textarea value={editDraft.description} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} rows={2} className={inputCls} placeholder="Description" />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="flex-1 bg-cama text-white text-sm font-bold py-1.5 rounded-lg hover:bg-cama/90">Enregistrer</button>
                          <button onClick={() => setEditId(null)} className="px-3 text-sm text-muted hover:text-ink">Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${KIND_TINT[m.kind]}`}>{KIND_LABEL[m.kind]}</span>
                          {m.category && <span className="text-[10px] text-subtle bg-surface border border-border px-1.5 py-0.5 rounded">{m.category}</span>}
                        </div>
                        <p className="font-bold text-ink text-sm leading-snug break-words">{m.title}</p>
                        {m.description && <p className="text-xs text-muted line-clamp-2">{m.description}</p>}
                        <div className="text-[11px] text-subtle flex items-center gap-2 mt-auto pt-1">
                          <span>{fmtSize(m.size_mo)}</span>
                          <span>·</span>
                          <span>{fmtDate(m.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <button onClick={() => copyUrl(m)}
                            className="flex items-center gap-1 text-xs font-bold text-muted hover:text-cama border border-border rounded-lg px-2 py-1 transition-colors">
                            {copiedId === m.id ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier l'URL</>}
                          </button>
                          <div className="flex-1" />
                          {canEdit && (
                            <>
                              <button onClick={() => startEdit(m)} title="Modifier" className="p-1.5 rounded-lg hover:bg-surface text-muted"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => remove(m)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cama";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${active ? "bg-cama text-white" : "bg-white border border-border text-muted hover:text-ink"}`}>
      {label}
      <span className={`text-[10px] px-1.5 rounded-full ${active ? "bg-white/20" : "bg-surface"}`}>{count}</span>
    </button>
  );
}
