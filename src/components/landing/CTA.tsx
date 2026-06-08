import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck, Wifi } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-24 bg-hero relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="inline-flex w-20 h-20 rounded-3xl bg-white/10 items-center justify-center mb-8 border border-white/20">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
          Prêt à digitaliser
          <br />
          l&apos;académique JFN ?
        </h2>
        <p className="text-xl text-white/70 leading-relaxed mb-10 max-w-2xl mx-auto">
          Rejoignez la plateforme qui comprend les réalités du terrain camerounais.
          Sécurisée, légère, et conçue pour durer.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent/90 active:scale-95 transition-all duration-150 shadow-2xl shadow-accent/30"
          >
            Accéder à CAMA
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/30 text-white font-bold text-base hover:bg-white/10 active:scale-95 transition-all duration-150"
          >
            Connexion
          </Link>
        </div>

        {/* Trust pills */}
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: ShieldCheck, text: "Données sécurisées HTTPS + bcrypt" },
            { icon: Wifi, text: "Optimisé connexion 3G/4G" },
            { icon: GraduationCap, text: "Conforme système LMD Cameroun" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 glass rounded-full px-4 py-2">
              <Icon className="w-4 h-4 text-white/60" />
              <span className="text-white/70 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
