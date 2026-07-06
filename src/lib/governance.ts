import { supabase } from "@/lib/supabase";
import type { DBUser, AdminLevel } from "@/lib/supabase";
import { notify } from "@/lib/notifications";

/* ════════════════════════════════════════════════════════════
   GOUVERNANCE ADMINISTRATIVE — hiérarchie académique CAMA
   coordinateur (semi-admin, par filière) < admin (directeur) <
   super_admin (recteur). La gestion étudiante est forte en bas,
   la gestion globale s'étend en montant.
════════════════════════════════════════════════════════════ */

export const ADMIN_LEVELS: { id: AdminLevel; label: string; academic: string; rank: number }[] = [
  { id: "coordinateur", label: "Coordinateur", academic: "Coordination de filière — proche des étudiants", rank: 1 },
  { id: "admin",        label: "Administrateur", academic: "Direction — gestion élargie", rank: 2 },
  { id: "super_admin",  label: "Super administrateur", academic: "Rectorat — gouvernance globale", rank: 3 },
];

export function levelMeta(l: AdminLevel | null) {
  return ADMIN_LEVELS.find((x) => x.id === l) ?? null;
}
export function levelRank(l: AdminLevel | null): number {
  return levelMeta(l)?.rank ?? 0;
}

/** Périmètre étudiant : un coordinateur ne « voit » que les filières de son
    scope ; admin et super_admin voient tout. */
export function inScope(u: Pick<DBUser, "admin_level" | "admin_scope">, parcoursSlug: string | null | undefined): boolean {
  if (u.admin_level === "admin" || u.admin_level === "super_admin") return true;
  if (u.admin_level === "coordinateur") return !!parcoursSlug && (u.admin_scope ?? []).includes(parcoursSlug);
  return false;
}

/** Capacités selon le niveau (gestion étudiant décroît en montant,
    gouvernance globale croît). */
export function can(u: Pick<DBUser, "admin_level" | "role">, action:
  | "manage_students" | "validate_inscription" | "grade_override"
  | "manage_program" | "manage_teachers" | "assign_teacher"
  | "manage_admins" | "global_settings" | "view_audit" | "manage_media_role"
): boolean {
  const lvl = u.admin_level;
  if (!lvl && u.role !== "admin") return false;
  const r = levelRank(lvl);
  switch (action) {
    // Gestion étudiante : accessible à tous les niveaux (forte en bas)
    case "manage_students":
    case "validate_inscription":
    case "grade_override":
      return r >= 1;
    // Gestion pédagogique élargie : à partir d'administrateur
    case "manage_program":
    case "manage_teachers":
    case "assign_teacher":
    case "view_audit":
      return r >= 2;
    // Gouvernance globale : super_admin seulement
    case "manage_admins":
    case "global_settings":
    case "manage_media_role":
      return r >= 3;
    default:
      return false;
  }
}

// ── Attribution des niveaux (super_admin uniquement) ──
export async function setAdminLevel(userId: string, level: AdminLevel | null, scope: string[] = []) {
  return supabase.from("users").update({ admin_level: level, admin_scope: scope }).eq("id", userId);
}
export async function setMediaManager(userId: string, on: boolean) {
  return supabase.from("users").update({ is_media_manager: on }).eq("id", userId);
}

/* ════════════════════════════════════════════════════════════
   MESSAGERIE INTERNE
════════════════════════════════════════════════════════════ */
export interface DBMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  subject: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
}

export async function sendMessage(fromId: string, toId: string, body: string, subject?: string) {
  const res = await supabase.from("internal_messages").insert({
    from_user_id: fromId, to_user_id: toId, body: body.trim(), subject: subject?.trim() || null,
  });
  if (!res.error) {
    await notify(toId, "message", "Nouveau message",
      subject?.trim() || body.trim().slice(0, 120), "/messagerie");
  }
  return res;
}
export async function fetchInbox(userId: string): Promise<DBMessage[]> {
  const { data } = await supabase.from("internal_messages").select("*")
    .eq("to_user_id", userId).order("created_at", { ascending: false });
  return (data as DBMessage[]) ?? [];
}
export async function fetchSent(userId: string): Promise<DBMessage[]> {
  const { data } = await supabase.from("internal_messages").select("*")
    .eq("from_user_id", userId).order("created_at", { ascending: false });
  return (data as DBMessage[]) ?? [];
}
/** Fil de discussion entre deux utilisateurs (les deux sens). */
export async function fetchThread(a: string, b: string): Promise<DBMessage[]> {
  const { data } = await supabase.from("internal_messages").select("*")
    .or(`and(from_user_id.eq.${a},to_user_id.eq.${b}),and(from_user_id.eq.${b},to_user_id.eq.${a})`)
    .order("created_at", { ascending: true });
  return (data as DBMessage[]) ?? [];
}
export async function markRead(messageId: string) {
  return supabase.from("internal_messages").update({ read_at: new Date().toISOString() }).eq("id", messageId);
}
export async function countUnread(userId: string): Promise<number> {
  const { count } = await supabase.from("internal_messages")
    .select("*", { count: "exact", head: true }).eq("to_user_id", userId).is("read_at", null);
  return count ?? 0;
}

/* ════════════════════════════════════════════════════════════
   JOURNAL D'AUDIT
════════════════════════════════════════════════════════════ */
export type AuditSeverity = "info" | "warn" | "critical";
export interface DBAudit {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity: string | null;
  detail: string | null;
  severity: AuditSeverity;
  created_at: string;
}

export async function logAudit(entry: {
  actorId: string | null; actorName?: string | null; action: string;
  entity?: string | null; detail?: string | null; severity?: AuditSeverity;
}) {
  return supabase.from("audit_log").insert({
    actor_id: entry.actorId, actor_name: entry.actorName ?? null, action: entry.action,
    entity: entry.entity ?? null, detail: entry.detail ?? null, severity: entry.severity ?? "info",
  });
}
export async function fetchAudit(limit = 200): Promise<DBAudit[]> {
  const { data } = await supabase.from("audit_log").select("*")
    .order("created_at", { ascending: false }).limit(limit);
  return (data as DBAudit[]) ?? [];
}

/* ════════════════════════════════════════════════════════════
   RESSOURCES MÉDIA (managées par le media_manager, visibles par tous)
════════════════════════════════════════════════════════════ */
export type MediaKind = "image" | "video" | "logo" | "document" | "audio";
export interface DBMedia {
  id: string;
  title: string;
  kind: MediaKind;
  category: string | null;
  url: string;
  description: string | null;
  size_mo: number | null;
  created_by: string | null;
  created_at: string;
}
export async function fetchMedia(): Promise<DBMedia[]> {
  const { data } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
  return (data as DBMedia[]) ?? [];
}
export async function addMedia(m: Partial<DBMedia>) {
  return supabase.from("media_assets").insert(m);
}
export async function updateMedia(id: string, patch: Partial<DBMedia>) {
  return supabase.from("media_assets").update(patch).eq("id", id);
}
export async function deleteMedia(id: string) {
  return supabase.from("media_assets").delete().eq("id", id);
}

export function userName(u: Pick<DBUser, "first_name" | "last_name"> | undefined): string {
  return u ? `${u.first_name} ${u.last_name}`.trim() : "—";
}
