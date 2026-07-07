import { supabase } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════
   DIPLÔMES & ATTESTATIONS — documents officiels vérifiables
   Chaque document porte un code unique (CAMA-XXXX) apposé en QR,
   vérifiable publiquement via /verifier/[code]. Révocable.
════════════════════════════════════════════════════════════ */

export type DiplomaKind = "licence" | "attestation" | "releve";

export interface DBDiploma {
  id: string;
  student_id: string;
  kind: DiplomaKind;
  parcours_slug: string | null;
  parcours_title: string | null;
  academic_year: string | null;
  level: string | null;
  code: string;
  average: number | null;
  mention: string | null;
  decision: string | null;
  issued_at: string;
  issued_by: string | null;
  revoked: boolean;
  revoked_at: string | null;
}

export const DIPLOMA_KIND_LABEL: Record<DiplomaKind, string> = {
  licence: "Diplôme de Licence",
  attestation: "Attestation de scolarité",
  releve: "Relevé de notes certifié",
};

/** Génère un code de vérification « CAMA-XXXX » (4 à 6 caractères
    alphanumériques majuscules). Usage client — Math.random suffit. */
export function genCode(): string {
  const raw = (Math.random().toString(36) + Math.random().toString(36))
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
  const len = 4 + Math.floor(Math.random() * 3); // 4..6
  return `CAMA-${raw.slice(0, len)}`;
}

export interface IssueDiplomaPayload {
  student_id: string;
  kind: DiplomaKind;
  parcours_slug?: string | null;
  parcours_title?: string | null;
  academic_year?: string | null;
  level?: string | null;
  average?: number | null;
  mention?: string | null;
  decision?: string | null;
  issued_by?: string | null;
}

/** Émet un document : insère la ligne avec un code unique et la retourne. */
export async function issueDiploma(payload: IssueDiplomaPayload): Promise<DBDiploma | null> {
  const { data, error } = await supabase
    .from("diplomas")
    .insert({
      student_id: payload.student_id,
      kind: payload.kind,
      parcours_slug: payload.parcours_slug ?? null,
      parcours_title: payload.parcours_title ?? null,
      academic_year: payload.academic_year ?? null,
      level: payload.level ?? null,
      code: genCode(),
      average: payload.average ?? null,
      mention: payload.mention ?? null,
      decision: payload.decision ?? null,
      issued_by: payload.issued_by ?? null,
      revoked: false,
    })
    .select("*")
    .single();
  if (error) return null;
  return data as DBDiploma;
}

export type VerifyStatus = "valide" | "revoque" | "introuvable";

export interface VerifyResult {
  status: VerifyStatus;
  diploma?: DBDiploma;
}

/** Vérifie un code de document (insensible à la casse). */
export async function verifyDiploma(code: string): Promise<VerifyResult> {
  const { data } = await supabase
    .from("diplomas")
    .select("*")
    .ilike("code", code)
    .maybeSingle();
  if (!data) return { status: "introuvable" };
  const d = data as DBDiploma;
  return { status: d.revoked ? "revoque" : "valide", diploma: d };
}

/** Documents émis pour un étudiant (plus récents en premier). */
export async function fetchStudentDiplomas(studentId: string): Promise<DBDiploma[]> {
  const { data } = await supabase
    .from("diplomas")
    .select("*")
    .eq("student_id", studentId)
    .order("issued_at", { ascending: false });
  return (data as DBDiploma[]) ?? [];
}

/** Révoque un document (le marque comme non valide). */
export async function revokeDiploma(id: string) {
  return supabase
    .from("diplomas")
    .update({ revoked: true, revoked_at: new Date().toISOString() })
    .eq("id", id);
}
