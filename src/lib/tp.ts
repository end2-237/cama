import { supabase } from "@/lib/supabase";
import type { DBRemoteMachine } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════
// TP — Machines Linux distantes (terminal web embarqué)
// ════════════════════════════════════════════════════════════

export async function fetchMachines(): Promise<DBRemoteMachine[]> {
  const { data } = await supabase.from("remote_machines").select("*").order("created_at", { ascending: false });
  return (data as DBRemoteMachine[]) ?? [];
}

export async function addMachine(m: Partial<DBRemoteMachine>) {
  return supabase.from("remote_machines").insert(m);
}

export async function updateMachine(id: string, patch: Partial<DBRemoteMachine>) {
  return supabase.from("remote_machines").update(patch).eq("id", id);
}

export async function deleteMachine(id: string) {
  return supabase.from("remote_machines").delete().eq("id", id);
}
