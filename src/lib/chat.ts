import { supabase } from "@/lib/supabase";

/* ════ Messagerie & forums CAMA ════
 * Persiste tous les chats de l'app (voir supabase/migrations/004_chat.sql).
 * Toutes les fonctions échouent en silence (retour vide) pour ne jamais
 * casser l'UI si la table n'est pas encore migrée.
 */

/* ── DM étudiant ↔ enseignant ── */
export interface DBDmMessage {
  id: string;
  thread_key: string;
  teacher_slug: string;
  student_id: string | null;
  sender: "moi" | "prof" | "etudiant" | "enseignant";
  author_name: string | null;
  body: string;
  created_at: string;
}

export async function fetchDm(threadKey: string): Promise<DBDmMessage[]> {
  const { data, error } = await supabase
    .from("dm_messages").select("*")
    .eq("thread_key", threadKey)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data as DBDmMessage[]) ?? [];
}

export async function sendDm(m: {
  thread_key: string; teacher_slug: string; student_id?: string | null;
  sender: DBDmMessage["sender"]; author_name?: string; body: string;
}): Promise<DBDmMessage | null> {
  const { data, error } = await supabase.from("dm_messages").insert(m).select("*").single();
  if (error) return null;
  return data as DBDmMessage;
}

/* ── Forum de classe (UE / cours) ── */
export interface DBForumMessage {
  id: string;
  scope: string;
  channel: string;
  user_id: string | null;
  author_name: string;
  role: string;
  body: string;
  created_at: string;
}

export async function fetchForum(channel: string): Promise<DBForumMessage[]> {
  const { data, error } = await supabase
    .from("forum_messages").select("*")
    .eq("channel", channel)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data as DBForumMessage[]) ?? [];
}

export async function postForum(m: {
  scope?: string; channel: string; user_id?: string | null;
  author_name: string; role?: string; body: string;
}): Promise<DBForumMessage | null> {
  const { data, error } = await supabase.from("forum_messages")
    .insert({ scope: "ue", role: "etudiant", ...m }).select("*").single();
  if (error) return null;
  return data as DBForumMessage;
}

/* ── Mur communautaire (page Journal) ── */
export interface DBCommunityMessage {
  id: string;
  user_id: string | null;
  author_name: string;
  avatar: string;
  body: string;
  likes: number;
  created_at: string;
}

export async function fetchCommunity(limit = 50): Promise<DBCommunityMessage[]> {
  const { data, error } = await supabase
    .from("community_messages").select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data as DBCommunityMessage[]) ?? []).reverse();
}

export async function postCommunity(m: {
  user_id?: string | null; author_name: string; avatar?: string; body: string;
}): Promise<DBCommunityMessage | null> {
  const { data, error } = await supabase.from("community_messages")
    .insert({ avatar: "#7C3AED", ...m }).select("*").single();
  if (error) return null;
  return data as DBCommunityMessage;
}

export async function likeCommunity(id: string, current: number): Promise<void> {
  await supabase.from("community_messages").update({ likes: current + 1 }).eq("id", id);
}

/* ── Réponse automatique du « prof » via Groq (DM) ──
 * Quand l'étudiant écrit à un enseignant hors-ligne, on génère une réponse
 * pédagogique plausible. Retourne null si Groq n'est pas configuré (le front
 * retombe alors sur une réponse générique).
 */
export async function profAutoReply(opts: {
  teacherName: string; subject: string; question: string;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/ai/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: opts.question,
        courseTitle: opts.subject,
        chapterTitle: opts.subject,
        context: `Tu incarnes ${opts.teacherName}, enseignant(e) de « ${opts.subject} » à l'Institut JFN. `
          + `Réponds brièvement et chaleureusement comme le ferait cet enseignant à un message privé d'étudiant, `
          + `en orientant vers les ressources du cours ou le prochain live si besoin.`,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.answer ?? "").trim() || null;
  } catch {
    return null;
  }
}
