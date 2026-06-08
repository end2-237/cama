import { MapPin, Building2, Search } from "lucide-react";

export default function FindSection() {
  return (
    <section className="section-white py-0 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 items-stretch">

          {/* Left — text + search */}
          <div className="py-20 pr-0 lg:pr-16">
            <h2 className="text-5xl font-light text-ink leading-tight mb-6">
              Trouvez votre{" "}
              <span className="green-underline">filière</span>
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-3">
              JFN regroupe 3 écoles avec des cycles Licence et Master couvrant
              l'informatique, la gestion et les sciences.
            </p>
            <p className="text-muted text-lg leading-relaxed mb-10">
              Introuvable dans votre niveau ? Contactez la scolarité pour une
              inscription personnalisée.
            </p>

            {/* Search box — NetAcad "Find an Academy" style */}
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
              <div className="flex items-center gap-3 px-5 py-4">
                <MapPin className="w-5 h-5 text-muted flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-ink">Par niveau</p>
                  <p className="text-xs text-subtle">L1, L2, L3, M1, M2...</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-4">
                <Building2 className="w-5 h-5 text-muted flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-ink">Par école</p>
                  <p className="text-xs text-subtle">École d'Informatique, Gestion, Sciences...</p>
                </div>
              </div>
              <div className="flex items-center justify-end px-5 py-4 bg-surface">
                <button className="btn-green gap-2 text-sm">
                  <Search className="w-4 h-4" />
                  Rechercher
                </button>
              </div>
            </div>
          </div>

          {/* Right — full bleed photo */}
          <div className="hidden lg:block -mr-8">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80"
              alt="Amphithéâtre JFN"
              className="w-full h-full min-h-[500px] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
