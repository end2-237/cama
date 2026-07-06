import { supabase } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════
   DOSSIER ADMINISTRATIF — pièces justificatives de l'étudiant
════════════════════════════════════════════════════════════ */

const BUCKET = "course-media";

export type DocKind = "acte_naissance" | "diplome" | "photo" | "cni" | "releve_anterieur" | "autre";
export type DocStatus = "depose" | "valide" | "refuse";

export interface DBStudentDocument {
  id: string;
  student_id: string;
  kind: DocKind;
  title: string | null;
  url: string;
  size_mo: number | null;
  status: DocStatus;
  note_admin: string | null;
  uploaded_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export const DOC_KINDS: { id: DocKind; label: string }[] = [
  { id: "acte_naissance",   label: "Acte de naissance" },
  { id: "diplome",          label: "Diplôme antérieur" },
  { id: "photo",            label: "Photo d'identité" },
  { id: "cni",              label: "CNI" },
  { id: "releve_anterieur", label: "Relevé antérieur" },
  { id: "autre",            label: "Autre" },
];

export function docKindLabel(kind: string): string {
  return DOC_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

/** Téléverse une pièce justificative dans le bucket puis l'enregistre en base. */
export async function uploadStudentDocument(
  studentId: string,
  kind: DocKind,
  file: File,
): Promise<DBStudentDocument | { error: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const path = `documents/${studentId}/${Date.now()}-${safe}.${ext}`.replace(/\.+/g, ".");
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const sizeMo = Math.round((file.size / 1_048_576) * 100) / 100;
  const { data: row, error: dbError } = await supabase
    .from("student_documents")
    .insert({
      student_id: studentId,
      kind,
      title: file.name,
      url: data.publicUrl,
      size_mo: sizeMo,
      status: "depose",
    })
    .select("*")
    .single();
  if (dbError) return { error: dbError.message };
  return row as DBStudentDocument;
}

export async function fetchDocuments(studentId: string): Promise<DBStudentDocument[]> {
  const { data } = await supabase.from("student_documents").select("*")
    .eq("student_id", studentId).order("uploaded_at", { ascending: false });
  return (data as DBStudentDocument[]) ?? [];
}

export async function fetchAllPending(): Promise<DBStudentDocument[]> {
  const { data } = await supabase.from("student_documents").select("*")
    .eq("status", "depose").order("uploaded_at", { ascending: false });
  return (data as DBStudentDocument[]) ?? [];
}

export async function reviewDocument(
  id: string,
  status: DocStatus,
  noteAdmin: string | null,
  reviewerId: string,
) {
  return supabase.from("student_documents").update({
    status,
    note_admin: noteAdmin?.trim() || null,
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);
}

export async function deleteDocument(id: string) {
  // Tente de retirer le fichier du storage à partir de l'URL publique
  const { data: row } = await supabase.from("student_documents").select("url").eq("id", id).single();
  const url = (row as { url: string } | null)?.url;
  if (url) {
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const path = decodeURIComponent(url.slice(idx + marker.length));
      await supabase.storage.from(BUCKET).remove([path]);
    }
  }
  return supabase.from("student_documents").delete().eq("id", id);
}
