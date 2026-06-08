import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ScrollText, Check } from "lucide-react";
import { PARCOURS, getParcours } from "@/lib/parcours";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export function generateStaticParams() {
  return PARCOURS.map((p) => ({ slug: p.slug }));
}

const sections = [
  {
    titre: "Article 1 — Inscription & assiduité",
    points: [
      "L'inscription n'est définitive qu'après paiement des frais de dossier et de la première tranche de scolarité.",
      "La présence est obligatoire pour les cycles présentiel et hybride (minimum 75% par semestre).",
      "Toute absence doit être justifiée auprès de la scolarité sous 48 heures.",
      "Trois absences non justifiées entraînent une convocation disciplinaire.",
    ],
  },
  {
    titre: "Article 2 — Discipline & comportement",
    points: [
      "Le respect mutuel entre étudiants, enseignants et personnel est exigé en tout lieu.",
      "Le port de la carte d'étudiant est obligatoire sur le campus.",
      "Toute forme de fraude ou de plagiat est sanctionnée selon le barème disciplinaire.",
      "L'usage du téléphone est interdit pendant les cours sauf usage pédagogique autorisé.",
    ],
  },
  {
    titre: "Article 3 — Évaluations & examens",
    points: [
      "Les évaluations combinent contrôle continu (40%) et examen final (60%).",
      "Les examens en ligne sont surveillés par proctoring IA (anti-copie, anti-fraude).",
      "Une moyenne de 10/20 est requise pour valider chaque unité d'enseignement.",
      "Les sessions de rattrapage sont organisées en fin de semestre.",
    ],
  },
  {
    titre: "Article 4 — Vie numérique & plateforme",
    points: [
      "Chaque étudiant dispose d'un compte CAMA personnel et confidentiel.",
      "Le partage d'identifiants ou de contenus de cours protégés est interdit.",
      "Les données académiques sont conservées conformément à la politique de confidentialité.",
      "Le support technique est disponible du lundi au samedi.",
    ],
  },
  {
    titre: "Article 5 — Frais & remboursements",
    points: [
      "Les frais de dossier ne sont pas remboursables.",
      "Un désistement avant le début des cours donne droit à un remboursement de 70% de la scolarité.",
      "Les facilités de paiement sont accordées sur dossier validé par la scolarité.",
      "Tout retard de paiement peut suspendre l'accès à la plateforme.",
    ],
  },
];

export default function Page({ params }: { params: { slug: string } }) {
  const p = getParcours(params.slug);
  if (!p) notFound();

  return (
    <>
      <Navbar />
      <main className="pt-16 bg-white">
        {/* HERO */}
        <section className="bg-surface border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <Link href={`/parcours/${p.slug}/campus`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour au campus
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-cama-50 flex items-center justify-center">
                <ScrollText className="w-6 h-6 text-cama" />
              </div>
              <div>
                <p className="text-sm text-muted">Institut JFN · {p.title}</p>
                <h1 className="text-3xl font-light text-ink">Règlement intérieur</h1>
              </div>
            </div>
            <p className="text-muted max-w-2xl">
              Les règles ci-dessous s&apos;appliquent à tous les étudiants de l&apos;Institut JFN, quel que soit le cycle choisi.
            </p>
          </div>
        </section>

        {/* ARTICLES */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="space-y-8">
            {sections.map((s) => (
              <div key={s.titre} className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-bold text-ink mb-4 pb-3 border-b border-border">{s.titre}</h2>
                <ul className="space-y-3">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3 text-sm text-muted leading-relaxed">
                      <Check className="w-4 h-4 text-cama mt-0.5 flex-shrink-0" /> {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Acceptation */}
          <div className="mt-10 bg-cama-50/50 border border-cama/10 rounded-2xl p-6 text-center">
            <p className="text-muted mb-5">
              En vous inscrivant, vous reconnaissez avoir lu et accepté le présent règlement intérieur.
            </p>
            <Link href={`/parcours/${p.slug}/pricing`} className="btn-primary gap-2">
              J&apos;accepte et je continue
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
