import { supabase } from "@/lib/supabase";

/* ════ Journal de l'école (Le Journal JFN) ════
 * Articles éditoriaux multi-médias alimentant le fil d'actualités
 * du dashboard et la page « Toutes les éditions » (/journal).
 */

export type JournalMediaKind = "none" | "image" | "video" | "audio" | "reel" | "live";

export interface JournalRef { label: string; href: string }

export interface DBJournalArticle {
  id: string;
  rubrique: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  media_kind: JournalMediaKind;
  media_src: string | null;
  media_url: string | null;
  media_legend: string | null;
  media_duration: string | null;
  media_at: string | null;
  author: string;
  cover_url: string | null;
  tags: string[] | null;
  refs: JournalRef[] | null;
  cta_label: string | null;
  cta_href: string | null;
  featured: boolean;
  published: boolean;
  views: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const JOURNAL_RUBRIQUES = [
  "À la une", "Direct", "Vie du campus", "Scolarité",
  "Podcast", "Ressources", "Sport", "Culture", "Tribune",
] as const;

/** Liste les articles publiés (les plus récents d'abord, vedette en tête). */
export async function fetchJournal(onlyPublished = true): Promise<DBJournalArticle[]> {
  let q = supabase.from("journal_articles").select("*")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (onlyPublished) q = q.eq("published", true);
  const { data, error } = await q;
  if (error) return [];
  return (data as DBJournalArticle[]) ?? [];
}

export async function fetchJournalArticle(id: string): Promise<DBJournalArticle | null> {
  const { data } = await supabase.from("journal_articles").select("*").eq("id", id).maybeSingle();
  return (data as DBJournalArticle) ?? null;
}

export async function createJournalArticle(a: Partial<DBJournalArticle>): Promise<string | null> {
  const { data } = await supabase.from("journal_articles").insert(a).select("id").single();
  return (data as { id: string } | null)?.id ?? null;
}

export async function updateJournalArticle(id: string, patch: Partial<DBJournalArticle>) {
  return supabase.from("journal_articles")
    .update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
}

export async function deleteJournalArticle(id: string) {
  return supabase.from("journal_articles").delete().eq("id", id);
}

/** Incrémente le compteur de vues (best-effort, sans bloquer l'UI). */
export async function bumpJournalViews(id: string, current: number) {
  return supabase.from("journal_articles").update({ views: current + 1 }).eq("id", id);
}

/* ── Réactions (like / save) — interactions type insta/tiktok ── */
export async function toggleReaction(articleId: string, userId: string, kind: "like" | "save", on: boolean) {
  if (on) {
    return supabase.from("journal_reactions").upsert(
      { article_id: articleId, user_id: userId, kind },
      { onConflict: "article_id,user_id,kind" },
    );
  }
  return supabase.from("journal_reactions").delete()
    .eq("article_id", articleId).eq("user_id", userId).eq("kind", kind);
}

export async function fetchMyReactions(userId: string): Promise<{ article_id: string; kind: string }[]> {
  const { data } = await supabase.from("journal_reactions")
    .select("article_id, kind").eq("user_id", userId);
  return (data as { article_id: string; kind: string }[]) ?? [];
}

export async function fetchReactionCounts(): Promise<Record<string, number>> {
  const { data } = await supabase.from("journal_reactions").select("article_id").eq("kind", "like");
  const counts: Record<string, number> = {};
  (data as { article_id: string }[] | null)?.forEach((r) => {
    counts[r.article_id] = (counts[r.article_id] ?? 0) + 1;
  });
  return counts;
}
