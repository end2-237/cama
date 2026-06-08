import { notFound } from "next/navigation";
import { PARCOURS, getParcours } from "@/lib/parcours";
import ParcoursDetail from "@/components/parcours/ParcoursDetail";

export function generateStaticParams() {
  return PARCOURS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = getParcours(params.slug);
  return {
    title: p ? `${p.title} — Parcours JFN | CAMA` : "Parcours — CAMA",
    description: p?.description,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const parcours = getParcours(params.slug);
  if (!parcours) notFound();
  return <ParcoursDetail parcours={parcours} />;
}
