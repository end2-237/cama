import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/nextauth";

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, role, school, level } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email déjà utilisé." }, { status: 409 });
    }

    const COLORS = ["bg-indigo-600", "bg-violet-600", "bg-blue-600", "bg-emerald-600", "bg-rose-600", "bg-amber-600"];
    const avatarColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const user = await prisma.user.create({
      data: {
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
        role:        role        ?? "etudiant",
        avatarColor,
        school:      school      ?? null,
        level:       level       ?? null,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
