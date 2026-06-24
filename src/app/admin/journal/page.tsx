"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Newspaper, Plus, Trash2, Eye, EyeOff, Star, X, Pencil,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchJournal, createJournalArticle, updateJournalArticle, deleteJournalArticle,
  JOURNAL_RUBRIQUES, type DBJournalArticle, type JournalMediaKind,
} from "@/lib/journal";

const MEDIA_KINDS: JournalMediaKind[] = ["none", "image", "video", "audio", "reel", "live"];
const MEDIA_LABEL: Record<JournalMediaKind, string> = {
  none: "Aucun", image: "Image", video: "Vidéo", audio: "Audio (podcast)", reel: "Reel", live: "Live",
};

type Draft = Partial<DBJournalArticle>;

export default function AdminJournalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<DBJournalArticle[]>([]);
  const [fetching, setFetching] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = useCallback(async () => {
    setArticles(await fetchJournal(false));
    setFetching(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const save = async () => {
    if (!draft?.title) return;
    setSaving(true);
    const tags = typeof draft.tags === "string" ? (draft.tags as unknown as string).split(",").map((t) => t.trim()).filter(Boolean) : draft.tags;
    const payload: Draft = { ...draft, tags, created_by: user.id };
    if (draft.id) await updateJournalArticle(draft.id, payload);
    else await createJournalArticle(payload);
    setSaving(false); setDraft(null); reload();
  };

  const togglePublish = async (a: DBJournalArticle) => { await updateJournalArticle(a.id, { published: !a.published }); reload(); };
  const toggleFeatured = async (a: DBJournalArticle) => { await updateJournalArticle(a.id, { featured: !a.featured }); reload(); };
  const remove = async (a: DBJournalArticle) => { if (confirm(`Supprimer « ${a.title} » ?`)) { await deleteJournalArticle(a.id); reload(); } };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Newspaper className="w-4 h-4 text-cama" /> Journal JFN
          </span>
          <div className="flex-1" />
          <Link href="/journal" className="text-xs text-muted hover:text-ink mr-2">Voir le journal →</Link>
          <button onClick={() => setDraft({ rubrique: "Campus", media_kind: "none", published: true, featured: false })}
            className="flex items-center gap-1.5 text-sm font-bold text-white bg-cama px-3 py-1.5 rounded-lg hover:bg-cama/90 transition-colors">
            <Plus className="w-4 h-4" /> Nouvel article
          </button>
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-4 sm:px-6 py-6">
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : articles.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center text-muted text-sm">Aucun article. Créez la première édition.</div>
        ) : (
          <div className="space-y-2">
            {articles.map((a) => (
              <div key={a.id} className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
                {(a.cover_url || a.media_src) && <img src={a.cover_url || a.media_src!} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cama">{a.rubrique}</span>
                    <span className="text-[10px] text-subtle">{MEDIA_LABEL[a.media_kind]}</span>
                    {a.featured && <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-500" /> À la une</span>}
                  </div>
                  <p className="font-bold text-ink truncate">{a.title}</p>
                  <p className="text-xs text-muted truncate">{a.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleFeatured(a)} title="À la une" className={`p-2 rounded-lg hover:bg-surface ${a.featured ? "text-amber-500" : "text-subtle"}`}><Star className={`w-4 h-4 ${a.featured ? "fill-amber-500" : ""}`} /></button>
                  <button onClick={() => togglePublish(a)} title={a.published ? "Publié" : "Brouillon"} className={`p-2 rounded-lg hover:bg-surface ${a.published ? "text-green-600" : "text-subtle"}`}>{a.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                  <button onClick={() => setDraft({ ...a, tags: (a.tags ?? []).join(", ") as unknown as string[] })} className="p-2 rounded-lg hover:bg-surface text-muted"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(a)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Formulaire */}
      {draft && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setDraft(null)}>
          <div className="w-full max-w-lg h-full bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-border px-5 py-3 flex items-center justify-between">
              <p className="font-bold text-ink">{draft.id ? "Modifier l'article" : "Nouvel article"}</p>
              <button onClick={() => setDraft(null)} className="p-1.5 rounded-lg hover:bg-surface"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <Field label="Titre"><input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputCls} /></Field>
              <Field label="Rubrique">
                <select value={draft.rubrique ?? "Campus"} onChange={(e) => setDraft({ ...draft, rubrique: e.target.value })} className={inputCls}>
                  {["Campus", ...JOURNAL_RUBRIQUES].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Sous-titre"><input value={draft.subtitle ?? ""} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className={inputCls} /></Field>
              <Field label="Corps de l'article"><textarea value={draft.body ?? ""} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={5} className={inputCls} /></Field>
              <Field label="Auteur"><input value={draft.author ?? ""} onChange={(e) => setDraft({ ...draft, author: e.target.value })} placeholder="Rédaction JFN" className={inputCls} /></Field>

              <div className="border-t border-border pt-3">
                <Field label="Type de média">
                  <div className="flex flex-wrap gap-1.5">
                    {MEDIA_KINDS.map((k) => (
                      <button key={k} onClick={() => setDraft({ ...draft, media_kind: k })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${draft.media_kind === k ? "bg-cama text-white" : "bg-surface text-muted hover:bg-border"}`}>
                        {MEDIA_LABEL[k]}
                      </button>
                    ))}
                  </div>
                </Field>
                {draft.media_kind !== "none" && draft.media_kind !== "audio" && (
                  <Field label="Image / poster (URL)"><input value={draft.media_src ?? ""} onChange={(e) => setDraft({ ...draft, media_src: e.target.value })} placeholder="https://…" className={inputCls} /></Field>
                )}
                {(draft.media_kind === "video" || draft.media_kind === "audio" || draft.media_kind === "live") && (
                  <Field label="URL ressource (mp4/mp3/lien live)"><input value={draft.media_url ?? ""} onChange={(e) => setDraft({ ...draft, media_url: e.target.value })} placeholder="https://…" className={inputCls} /></Field>
                )}
                {(draft.media_kind === "video" || draft.media_kind === "audio" || draft.media_kind === "reel") && (
                  <Field label="Durée"><input value={draft.media_duration ?? ""} onChange={(e) => setDraft({ ...draft, media_duration: e.target.value })} placeholder="2:14 · 18 min" className={inputCls} /></Field>
                )}
                {draft.media_kind === "live" && (
                  <Field label="Horaire du live"><input value={draft.media_at ?? ""} onChange={(e) => setDraft({ ...draft, media_at: e.target.value })} placeholder="Demain · 10h00" className={inputCls} /></Field>
                )}
                {draft.media_kind !== "none" && (
                  <Field label="Légende média"><input value={draft.media_legend ?? ""} onChange={(e) => setDraft({ ...draft, media_legend: e.target.value })} className={inputCls} /></Field>
                )}
              </div>

              <div className="border-t border-border pt-3">
                <Field label="Image de Une (cover, URL)"><input value={draft.cover_url ?? ""} onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })} placeholder="grande image — page éditions" className={inputCls} /></Field>
                <Field label="Tags (séparés par des virgules)"><input value={(draft.tags as unknown as string) ?? ""} onChange={(e) => setDraft({ ...draft, tags: e.target.value as unknown as string[] })} placeholder="hackathon, concours" className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Texte du bouton (CTA)"><input value={draft.cta_label ?? ""} onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })} className={inputCls} /></Field>
                  <Field label="Lien du bouton"><input value={draft.cta_href ?? ""} onChange={(e) => setDraft({ ...draft, cta_href: e.target.value })} className={inputCls} /></Field>
                </div>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} /> À la une</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published ?? true} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Publié</label>
                </div>
              </div>

              <button onClick={save} disabled={saving || !draft.title}
                className="w-full py-2.5 bg-cama text-white font-bold rounded-lg hover:bg-cama/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cama";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <label className="block text-xs font-bold text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
