import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CAMA database...");

  // ── UEs ─────────────────────────────────────────────────────────────────────
  const ues = await Promise.all([
    prisma.uE.upsert({ where: { code: "INFO101" }, update: {}, create: { code: "INFO101", title: "Algorithmique", credits: 4 } }),
    prisma.uE.upsert({ where: { code: "MATH101" }, update: {}, create: { code: "MATH101", title: "Analyse Mathématique", credits: 4 } }),
    prisma.uE.upsert({ where: { code: "INFO201" }, update: {}, create: { code: "INFO201", title: "Programmation Orientée Objet", credits: 3 } }),
    prisma.uE.upsert({ where: { code: "RES101" }, update: {},  create: { code: "RES101",  title: "Réseaux Informatiques", credits: 3 } }),
    prisma.uE.upsert({ where: { code: "BDD101" }, update: {},  create: { code: "BDD101",  title: "Bases de Données", credits: 3 } }),
  ]);
  console.log(`✅ ${ues.length} UEs`);

  // ── Users ────────────────────────────────────────────────────────────────────
  const hash = (p: string) => bcrypt.hash(p, 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "jean-paul@jfn.cm" },
      update: {},
      create: { email: "jean-paul@jfn.cm", password: await hash("etudiant123"), firstName: "Jean-Paul", lastName: "Mbarga", role: "etudiant", avatarColor: "bg-indigo-600", school: "École d'Informatique", level: "L2" },
    }),
    prisma.user.upsert({
      where: { email: "amina.bello@jfn.cm" },
      update: {},
      create: { email: "amina.bello@jfn.cm", password: await hash("enseignant123"), firstName: "Amina", lastName: "Bello", role: "enseignant", avatarColor: "bg-amber-600", school: "École des Sciences" },
    }),
    prisma.user.upsert({
      where: { email: "serge.nkamgang@jfn.cm" },
      update: {},
      create: { email: "serge.nkamgang@jfn.cm", password: await hash("admin123"), firstName: "Serge", lastName: "Nkamgang", role: "admin", avatarColor: "bg-violet-600", school: "Institut JFN" },
    }),
    prisma.user.upsert({
      where: { email: "marie.essomba@jfn.cm" },
      update: {},
      create: { email: "marie.essomba@jfn.cm", password: await hash("jury123"), firstName: "Marie", lastName: "Essomba", role: "jury", avatarColor: "bg-rose-600", school: "Institut JFN" },
    }),
  ]);
  console.log(`✅ ${users.length} utilisateurs`);

  // ── Calendrier ───────────────────────────────────────────────────────────────
  await prisma.calendarEvent.createMany({
    skipDuplicates: true,
    data: [
      { date: "2025-09-15", label: "Rentrée académique S1",        type: "rentree",    semester: 1 },
      { date: "2025-10-27", label: "Fin inscriptions pédagogiques", type: "admin",      semester: 1 },
      { date: "2025-12-20", label: "Fin des cours S1",              type: "fin_cours",  semester: 1 },
      { date: "2026-01-06", label: "Examens S1 — début",            type: "examen",     semester: 1 },
      { date: "2026-01-24", label: "Examens S1 — fin",              type: "examen",     semester: 1 },
      { date: "2026-02-09", label: "Rentrée S2",                    type: "rentree",    semester: 2 },
      { date: "2026-05-30", label: "Fin des cours S2",              type: "fin_cours",  semester: 2 },
      { date: "2026-06-08", label: "Examens S2 — début",            type: "examen",     semester: 2 },
      { date: "2026-06-26", label: "Examens S2 — fin",              type: "examen",     semester: 2 },
      { date: "2026-07-05", label: "Cérémonie de remise des diplômes", type: "ceremonie", semester: 2 },
    ],
  });
  console.log("✅ Calendrier académique");

  console.log("🎉 Seed terminé !");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
