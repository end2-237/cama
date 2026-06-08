import Navbar       from "@/components/landing/Navbar";
import Hero         from "@/components/landing/Hero";
import StatsBar     from "@/components/landing/StatsBar";
import Features     from "@/components/landing/Features";
import Modules      from "@/components/landing/Modules";
import LowBandwidth from "@/components/landing/LowBandwidth";
import Roles        from "@/components/landing/Roles";
import CTA          from "@/components/landing/CTA";
import Footer       from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <Modules />
      <LowBandwidth />
      <Roles />
      <CTA />
      <Footer />
    </main>
  );
}
