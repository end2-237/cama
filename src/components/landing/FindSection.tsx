import { MapPin, Building2, Search } from "lucide-react";

export default function FindSection() {
  return (
    <section className="bg-white py-0 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 items-stretch">

          {/* ── Texte + recherche ── */}
          <div className="py-20 pr-0 lg:pr-16">
            <span className="badge bg-cama-50 text-cama mb-4">Inscription</span>
            <h2 className="text-5xl font-light text-ink leading-tight mb-6">
              Trouvez votre{" "}
              <span className="cama-underline font-semibold">filière</span>
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-3">
              JFN regroupe 3 écoles avec des cycles Licence et Master couvrant
              l'informatique, la gestion et les sciences.
            </p>
            <p className="text-muted text-lg leading-relaxed mb-10">
              Introuvable dans votre niveau ? Contactez la scolarité pour
              une inscription personnalisée.
            </p>

            {/* Formulaire recherche */}
            <div className="bg-white border-2 border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-cama-50/30 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-cama-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-cama" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Par niveau</p>
                  <p className="text-xs text-subtle">L1, L2, L3, M1, M2...</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-cama-50/30 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-gold-dark" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Par école</p>
                  <p className="text-xs text-subtle">Informatique, Gestion, Sciences...</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-4 bg-surface">
                <span className="text-xs text-subtle">12 filières disponibles</span>
                <button className="btn-primary gap-2 text-sm py-2.5 px-6">
                  <Search className="w-4 h-4" />
                  Rechercher
                </button>
              </div>
            </div>
          </div>

          {/* ── Photo pleine hauteur — étudiant africain ── */}
          <div className="hidden lg:block -mr-8">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80"
              alt="Amphithéâtre JFN"
              className="w-full h-full min-h-[520px] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
