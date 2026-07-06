import { supabase } from "@/lib/supabase";
import type { DBUser, DBInscription, UserRole } from "@/lib/supabase";
import { notify } from "@/lib/notifications";

// ════════════════════════════════════════════════════════════
// ADMINISTRATION — utilisateurs & inscriptions
// ════════════════════════════════════════════════════════════

export async function fetchUsers(): Promise<DBUser[]> {
  const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  return (data as DBUser[]) ?? [];
}

export async function updateUserRole(id: string, role: UserRole) {
  return supabase.from("users").update({ role }).eq("id", id);
}

export interface InscriptionWithUser extends DBInscription {
  user?: Pick<DBUser, "first_name" | "last_name" | "email">;
}

export async function fetchInscriptions(status?: DBInscription["status"]): Promise<InscriptionWithUser[]> {
  let q = supabase
    .from("inscriptions")
    .select("*, user:users(first_name,last_name,email)")
    .order("enrolled_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data as InscriptionWithUser[]) ?? [];
}

export async function setInscriptionStatus(id: string, status: DBInscription["status"]) {
  const res = await supabase.from("inscriptions").update({ status })
    .eq("id", id).select("user_id,parcours_title").maybeSingle();
  const row = res.data as Pick<DBInscription, "user_id" | "parcours_title"> | null;
  if (row && (status === "validee" || status === "rejetee")) {
    await notify(
      row.user_id,
      "inscription",
      status === "validee" ? "Inscription validée" : "Inscription rejetée",
      status === "validee"
        ? `Votre inscription au parcours ${row.parcours_title} a été validée par l'administration.`
        : `Votre inscription au parcours ${row.parcours_title} a été rejetée. Contactez l'administration.`,
      "/etudiant/programme",
    );
  }
  return res;
}

export interface AdminStats {
  students: number;
  teachers: number;
  pending: number;     // inscriptions en attente
  validated: number;   // inscriptions validées
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [students, teachers, pending, validated] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "etudiant"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "enseignant"),
    supabase.from("inscriptions").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
    supabase.from("inscriptions").select("*", { count: "exact", head: true }).eq("status", "validee"),
  ]);
  return {
    students:  students.count ?? 0,
    teachers:  teachers.count ?? 0,
    pending:   pending.count ?? 0,
    validated: validated.count ?? 0,
  };
}
