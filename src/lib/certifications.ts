import { supabase } from "@/lib/supabase";
import type { DBCertification, DBCertEnrollment, CertEnrollStatus } from "@/lib/supabase";

export const CERT_PROVIDERS = ["AWS", "Cisco", "Google", "Microsoft", "Oracle", "CompTIA", "CAMA"] as const;
export const CERT_LEVELS = ["Fondation", "Associate", "Professionnel", "Expert"] as const;

// ── CRUD certifications (admin) ──
export async function fetchCertifications(onlyPublished = false): Promise<DBCertification[]> {
  let q = supabase.from("certifications").select("*").order("created_at", { ascending: false });
  if (onlyPublished) q = q.eq("published", true);
  const { data } = await q;
  return (data as DBCertification[]) ?? [];
}

export async function createCertification(c: Partial<DBCertification>) {
  const { data } = await supabase.from("certifications").insert(c).select("*").single();
  return (data as DBCertification) ?? null;
}

export async function updateCertification(id: string, patch: Partial<DBCertification>) {
  return supabase.from("certifications").update(patch).eq("id", id);
}

export async function deleteCertification(id: string) {
  return supabase.from("certifications").delete().eq("id", id);
}

// ── Inscriptions étudiants ──
export interface CertEnrollmentWithUser extends DBCertEnrollment {
  student?: { first_name: string; last_name: string; email: string; level: string | null };
}

export async function fetchCertEnrollments(certId: string): Promise<CertEnrollmentWithUser[]> {
  const { data } = await supabase.from("certification_enrollments")
    .select("*, student:users(first_name,last_name,email,level)")
    .eq("certification_id", certId).order("started_at");
  return (data as CertEnrollmentWithUser[]) ?? [];
}

export async function fetchAllCertEnrollments(): Promise<DBCertEnrollment[]> {
  const { data } = await supabase.from("certification_enrollments").select("*");
  return (data as DBCertEnrollment[]) ?? [];
}

export async function fetchMyCertEnrollments(studentId: string): Promise<DBCertEnrollment[]> {
  const { data } = await supabase.from("certification_enrollments").select("*").eq("student_id", studentId);
  return (data as DBCertEnrollment[]) ?? [];
}

export async function enrollCertification(certId: string, studentId: string) {
  return supabase.from("certification_enrollments")
    .upsert({ certification_id: certId, student_id: studentId }, { onConflict: "certification_id,student_id" });
}

export async function updateCertEnrollment(id: string, patch: Partial<DBCertEnrollment>) {
  return supabase.from("certification_enrollments").update(patch).eq("id", id);
}

export const CERT_STATUS_META: Record<CertEnrollStatus, { label: string; cls: string }> = {
  inscrit: { label: "Inscrit", cls: "bg-cama-50 text-cama" },
  en_cours: { label: "En cours", cls: "bg-gold/10 text-gold-dark" },
  obtenu: { label: "Obtenue", cls: "bg-green-50 text-green-600" },
  echec: { label: "Échec", cls: "bg-red-50 text-red-500" },
};
