import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Exécution SEMI-AUTONOME d'une tâche de l'Agent d'administration.
 *
 * POST /api/admin/agent/execute
 * body: { taskId: string, requesterId: string }
 *
 * • Vérifie que `requesterId` est admin (clé service, jamais exposée).
 * • Charge la tâche (agent_tasks), exécute chaque étape SÉLECTIONNÉE, écrit la
 *   progression au fur et à mesure — le panneau « Tâches » la suit en temps réel.
 * • S'exécute côté serveur : continue même si l'admin ferme la fenêtre.
 * • Périmètre : uniquement les actions du catalogue (valider inscription,
 *   relancer pour pièces manquantes). Chaque action notifie l'étudiant.
 */

interface Body { taskId?: string; requesterId?: string }

interface Step {
  id: string;
  label: string;
  action: "valider_inscription" | "relance_documents";
  target_id: string;
  params: Record<string, unknown>;
  selected: boolean;
  status: "attente" | "ok" | "echec" | "ignore";
  result?: string;
}

async function notify(admin: SupabaseClient, userId: string, kind: string, title: string, body: string, link: string) {
  await admin.from("notifications").insert({ user_id: userId, kind, title, body, link });
}

async function runStep(admin: SupabaseClient, step: Step): Promise<Step> {
  try {
    if (step.action === "valider_inscription") {
      const { error } = await admin.from("inscriptions").update({ status: "validee" }).eq("id", step.target_id);
      if (error) throw error;
      const userId = String(step.params.user_id ?? "");
      const parcours = String(step.params.parcours_title ?? "votre parcours");
      if (userId) {
        await notify(admin, userId, "inscription", "Inscription validée",
          `Votre inscription au parcours ${parcours} a été validée par l'administration.`,
          "/etudiant/programme");
      }
      return { ...step, status: "ok", result: "Inscription validée + étudiant notifié." };
    }

    if (step.action === "relance_documents") {
      const userId = String(step.params.user_id ?? "");
      const missing = Array.isArray(step.params.missing) ? (step.params.missing as string[]) : [];
      if (userId) {
        await notify(admin, userId, "inscription", "Dossier incomplet — pièces manquantes",
          `Pour finaliser votre inscription, veuillez déposer : ${missing.join(", ")}.`,
          "/onboarding");
      }
      return { ...step, status: "ok", result: `Relance envoyée (${missing.length} pièce(s)).` };
    }

    return { ...step, status: "ignore", result: "Action inconnue." };
  } catch (e) {
    return { ...step, status: "echec", result: e instanceof Error ? e.message : "Erreur." };
  }
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const taskId = (body.taskId ?? "").trim();
  const requesterId = (body.requesterId ?? "").trim();
  if (!taskId) return NextResponse.json({ error: "taskId manquant." }, { status: 400 });
  if (!requesterId) return NextResponse.json({ error: "Requête non authentifiée." }, { status: 401 });

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // 1. Droits : le demandeur doit être admin.
  const { data: requester } = await admin.from("users").select("role").eq("id", requesterId).maybeSingle();
  if (!requester || requester.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé : réservé à l'administration." }, { status: 403 });
  }

  // 2. Charger la tâche.
  const { data: task } = await admin.from("agent_tasks").select("*").eq("id", taskId).maybeSingle();
  if (!task) return NextResponse.json({ error: "Tâche introuvable." }, { status: 404 });
  if (task.admin_id !== requesterId) {
    return NextResponse.json({ error: "Cette tâche appartient à un autre administrateur." }, { status: 403 });
  }
  if (task.status === "termine" || task.status === "annule") {
    return NextResponse.json({ task }, { status: 200 }); // idempotent
  }

  const steps: Step[] = Array.isArray(task.steps) ? task.steps : [];
  await admin.from("agent_tasks").update({ status: "en_cours", updated_at: new Date().toISOString() }).eq("id", taskId);

  // 3. Exécuter les étapes sélectionnées, en écrivant la progression.
  let progress = 0;
  let failures = 0;
  const done: Step[] = [];

  for (const step of steps) {
    if (!step.selected) { done.push({ ...step, status: "ignore", result: "Non approuvée." }); continue; }
    if (step.status === "ok") { done.push(step); progress++; continue; } // reprise idempotente
    const ran = await runStep(admin, step);
    done.push(ran);
    if (ran.status === "echec") failures++; else progress++;
    await admin.from("agent_tasks").update({
      steps: [...done, ...steps.slice(done.length)],
      progress,
      updated_at: new Date().toISOString(),
    }).eq("id", taskId);
  }

  const selectedCount = steps.filter((s) => s.selected).length;
  const summary = `Terminé : ${progress}/${selectedCount} étape(s) exécutée(s)`
    + (failures ? `, ${failures} échec(s).` : ".");

  const { data: final } = await admin.from("agent_tasks").update({
    steps: done,
    progress,
    status: failures && progress === 0 ? "echoue" : "termine",
    summary,
    updated_at: new Date().toISOString(),
  }).eq("id", taskId).select("*").maybeSingle();

  // Trace d'audit.
  await admin.from("audit_log").insert({
    actor_id: requesterId,
    action: "agent.execute",
    entity: `agent_task:${taskId}`,
    severity: failures ? "warn" : "info",
    detail: `Agent — ${task.title} : ${summary}`,
  }).then(() => {}, () => {}); // best-effort

  return NextResponse.json({ task: final ?? task });
}
