import { notFound } from "next/navigation";
import { PARCOURS, getParcours } from "@/lib/parcours";
import InscriptionFlow from "@/components/parcours/InscriptionFlow";

export function generateStaticParams() {
  return PARCOURS.map((p) => ({ slug: p.slug }));
}

export default function Page({ params }: { params: { slug: string } }) {
  const parcours = getParcours(params.slug);
  if (!parcours) notFound();
  return <InscriptionFlow parcours={parcours} />;
}
