import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Garantit qu'un compte d'authentification (auth.users) existe pour un
 * enseignant dont le PROFIL existe déjà dans public.users.
 *
 * POST /api/auth/ensure-teacher   body: { email }
 *
 * Cas visé : le profil enseignant a été créé mais le compte Auth est absent
 * (création incomplète), d'où l'échec 422 de signInWithOtp. On (re)crée alors
 * le compte Auth avec email confirmé pour permettre la connexion par code.
 *
 * Sécurité : n'agit QUE si un profil « enseignant » existe pour cet email.
 * Aucune donnée sensible renvoyée. La clé service reste côté serveur.
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  let email = "";
  try { email = String((await req.json()).email ?? "").trim().toLowerCase(); }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  if (!email) return NextResponse.json({ error: "Email manquant." }, { status: 400 });

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // 1. Le profil enseignant doit exister.
  const { data: profile } = await admin
    .from("users").select("id, role, first_name, last_name").ilike("email", email).maybeSingle();
  if (!profile || profile.role !== "enseignant") {
    return NextResponse.json({ error: "Aucun profil enseignant pour cet email." }, { status: 404 });
  }

  // 2. Le compte Auth existe-t-il déjà ? (recherche paginée)
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    if (users.some((u) => (u.email ?? "").toLowerCase() === email)) {
      return NextResponse.json({ ok: true, repaired: false }); // rien à faire
    }
    if (users.length < 200) break;
  }

  // 3. Compte Auth absent → on le crée (email confirmé pour OTP direct).
  const { error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { first_name: profile.first_name, last_name: profile.last_name, role: "enseignant" },
  });
  if (error && !/already|exists|registered|duplicate/i.test(error.message)) {
    return NextResponse.json({ error: error.message.slice(0, 200) }, { status: 400 });
  }
  return NextResponse.json({ ok: true, repaired: true });
}
