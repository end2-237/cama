import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Création sécurisée d'un compte enseignant par l'administration.
 *
 * POST /api/admin/create-teacher
 * body: { email, firstName, lastName, school?, phone?, requesterId }
 *
 * - Vérifie que `requesterId` est bien un administrateur (rôle 'admin').
 * - Crée le compte Auth avec email_confirm:true (permet la connexion OTP directe).
 * - Insère le profil dans public.users (rôle 'enseignant').
 *
 * La clé service (SUPABASE_SERVICE_ROLE_KEY) reste strictement côté serveur :
 * le client admin est instancié localement, jamais exposé au navigateur.
 */

// Palette d'avatars (alignée sur l'inscription étudiante)
const AVATAR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

interface Body {
  email?: string;
  firstName?: string;
  lastName?: string;
  school?: string;
  phone?: string;
  requesterId?: string;
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const school = (body.school ?? "").trim() || null;
  const phone = (body.phone ?? "").trim() || null;
  const requesterId = (body.requesterId ?? "").trim();

  if (!email || !firstName || !lastName) {
    return NextResponse.json({ error: "Email, prénom et nom sont obligatoires." }, { status: 400 });
  }
  if (!requesterId) {
    return NextResponse.json({ error: "Requête non authentifiée." }, { status: 401 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Vérifier que le demandeur est bien admin
  const { data: requester, error: reqErr } = await admin
    .from("users")
    .select("role")
    .eq("id", requesterId)
    .maybeSingle();

  if (reqErr) {
    return NextResponse.json({ error: "Erreur de vérification des droits." }, { status: 500 });
  }
  if (!requester || requester.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé : réservé à l'administration." }, { status: 403 });
  }

  // 2. Création du compte Auth (email confirmé → OTP direct possible)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, role: "enseignant" },
  });

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "";
    if (/already|exists|registered/i.test(msg)) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 400 });
    }
    return NextResponse.json({ error: "Impossible de créer le compte enseignant." }, { status: 400 });
  }

  const userId = created.user.id;
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  // 3. Profil dans public.users
  const { error: profileErr } = await admin.from("users").insert({
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    role: "enseignant",
    avatar_color: avatarColor,
    school,
    phone,
    phone_prefix: phone ? "+237" : null,
  });

  if (profileErr) {
    // Rollback du compte Auth pour éviter un compte orphelin
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return NextResponse.json({ error: "Erreur d'enregistrement du profil enseignant." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: userId });
}
