import { supabase } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════
   NOTIFICATIONS — cloche de la barre de navigation
   (badge non-lus, dropdown, temps réel via postgres_changes)
════════════════════════════════════════════════════════════ */

export interface DBNotification {
  id: string;
  user_id: string;
  kind: string;           // 'inscription' | 'resultat' | 'message' | ...
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

/** Crée une notification pour un utilisateur. */
export async function notify(userId: string, kind: string, title: string, body?: string, link?: string) {
  return supabase.from("notifications").insert({
    user_id: userId, kind, title, body: body ?? null, link: link ?? null,
  });
}

/** Crée la même notification pour plusieurs utilisateurs. */
export async function notifyMany(userIds: string[], kind: string, title: string, body?: string, link?: string) {
  if (userIds.length === 0) return;
  return supabase.from("notifications").insert(
    userIds.map((user_id) => ({ user_id, kind, title, body: body ?? null, link: link ?? null })),
  );
}

/** Dernières notifications de l'utilisateur (plus récentes d'abord). */
export async function fetchNotifs(userId: string, limit = 30): Promise<DBNotification[]> {
  const { data } = await supabase.from("notifications").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  return (data as DBNotification[]) ?? [];
}

export async function markRead(id: string) {
  return supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllRead(userId: string) {
  return supabase.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("user_id", userId).is("read_at", null);
}

export async function countUnread(userId: string): Promise<number> {
  const { count } = await supabase.from("notifications")
    .select("*", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
  return count ?? 0;
}

/**
 * Abonnement temps réel aux nouvelles notifications de l'utilisateur.
 * Renvoie une fonction de désabonnement.
 */
export function subscribeNotifs(userId: string, cb: (n: DBNotification) => void): () => void {
  const channel = supabase
    .channel(`notifs-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as DBNotification;
        if (row) cb(row);
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/** Temps relatif en français (« À l'instant », « Il y a 3 h », …). */
export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "À l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return d === 1 ? "Il y a 1 jour" : `Il y a ${d} jours`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
