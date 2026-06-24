import { supabase } from "@/lib/supabase";
import type { DBCourseResource, ResourceKind } from "@/lib/supabase";

const BUCKET = "course-media";

/** Téléverse un fichier (PDF/vidéo) dans le bucket et renvoie son URL publique + poids en Mo. */
export async function uploadMedia(
  courseId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; sizeMo: number } | { error: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const path = `${courseId}/${Date.now()}-${safe}.${ext}`.replace(/\.+/g, ".");
  onProgress?.(10);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) return { error: error.message };
  onProgress?.(90);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  onProgress?.(100);
  return { url: data.publicUrl, sizeMo: Math.round((file.size / 1_048_576) * 100) / 100 };
}

/**
 * Choisit un palier de qualité vidéo adapté au débit (data budgeting).
 * Sert à recommander le préréglage d'upload côté enseignant.
 */
export function recommendedVideoQuality(connectionMbps: number): "240p" | "360p" | "480p" | "720p" {
  if (connectionMbps < 1) return "240p";
  if (connectionMbps < 2.5) return "360p";
  if (connectionMbps < 5) return "480p";
  return "720p";
}

/** Estime le poids compressé (Mo) d'une vidéo selon la durée et la qualité cible. */
export function estimateVideoSizeMo(durationMin: number, quality: "240p" | "360p" | "480p" | "720p"): number {
  const kbps = { "240p": 300, "360p": 600, "480p": 1000, "720p": 2000 }[quality];
  return Math.round(((kbps * 60 * durationMin) / 8 / 1024) * 10) / 10;
}

export async function fetchResources(courseId: string): Promise<DBCourseResource[]> {
  const { data } = await supabase.from("course_resources").select("*")
    .eq("program_course_id", courseId).order("created_at");
  return (data as DBCourseResource[]) ?? [];
}

export async function fetchResourcesForCourses(courseIds: string[]): Promise<DBCourseResource[]> {
  if (courseIds.length === 0) return [];
  const { data } = await supabase.from("course_resources").select("*")
    .in("program_course_id", courseIds).order("created_at");
  return (data as DBCourseResource[]) ?? [];
}

export async function addResource(r: {
  program_course_id: string; kind: ResourceKind; title: string;
  url?: string | null; size_mo?: number | null; created_by?: string | null;
}) {
  const { data } = await supabase.from("course_resources").insert(r).select("*").single();
  return (data as DBCourseResource) ?? null;
}

export async function deleteResource(id: string) {
  return supabase.from("course_resources").delete().eq("id", id);
}
