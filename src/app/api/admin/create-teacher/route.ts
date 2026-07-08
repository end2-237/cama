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

  let userId = created?.user?.id ?? "";
  let recovered = false;

  if (createErr || !userId) {
    const msg = createErr?.message ?? "";
    // Le compte Auth existe déjà : on le récupère pour (ré)assurer son profil,
    // plutôt que d'échouer — l'opération devient idempotente.
    if (/already|exists|registered|duplicate/i.test(msg)) {
      // Recherche paginée : le compte peut être au-delà de la 1re page.
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        const users = list?.users ?? [];
        const found = users.find((u) => (u.email ?? "").toLowerCase() === email);
        if (found) { userId = found.id; recovered = true; break; }
        if (users.length < 200) break; // dernière page atteinte
      }
    }
    if (!userId) {
      return NextResponse.json(
        { error: "Impossible de créer le compte enseignant.", detail: msg.slice(0, 200) },
        { status: 400 },
      );
    }
  }

  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  // 3. Profil dans public.users (upsert : robuste si le compte préexistait)
  const { error: profileErr } = await admin.from("users").upsert({
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    role: "enseignant",
    avatar_color: avatarColor,
    school,
    phone,
    phone_prefix: phone ? "+237" : null,
  }, { onConflict: "id" });

  if (profileErr) {
    // Rollback uniquement si l'on vient de créer le compte Auth (pas de récup).
    if (!recovered) await admin.auth.admin.deleteUser(userId).catch(() => {});
    return NextResponse.json(
      { error: "Erreur d'enregistrement du profil enseignant.", detail: profileErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: userId, recovered });
}
