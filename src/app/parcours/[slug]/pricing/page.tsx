import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PARCOURS, getParcours } from "@/lib/parcours";
import PricingView from "@/components/parcours/PricingView";

export function generateStaticParams() {
  return PARCOURS.map((p) => ({ slug: p.slug }));
}

export default function Page({ params }: { params: { slug: string } }) {
  const parcours = getParcours(params.slug);
  if (!parcours) notFound();
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PricingView parcours={parcours} />
    </Suspense>
  );
}
