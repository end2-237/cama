import Navbar          from "@/components/landing/Navbar";
import Hero            from "@/components/landing/Hero";
import StatsBar        from "@/components/landing/StatsBar";
import ScrollShowcase  from "@/components/landing/ScrollShowcase";
import Filieres        from "@/components/landing/Filieres";
import CoursesCarousel from "@/components/landing/CoursesCarousel";
import FindSection     from "@/components/landing/FindSection";
import WhyCAMA         from "@/components/landing/WhyCAMA";
import SplitSection    from "@/components/landing/SplitSection";
import Testimonials    from "@/components/landing/Testimonials";
import CTA             from "@/components/landing/CTA";
import Footer          from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="pt-16">
      <Navbar />
      <Hero />
      <StatsBar />
      <ScrollShowcase />
      <Filieres />
      <CoursesCarousel />
      <FindSection />
      <WhyCAMA />
      <SplitSection />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
