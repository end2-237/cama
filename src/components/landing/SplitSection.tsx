import Link from "next/link";

export default function SplitSection() {
  return (
    <>
      {/* ── Split 1 : image gauche, texte droite ── */}
      <section className="bg-white py-0 overflow-hidden">
        <div className="grid lg:grid-cols-2 items-stretch">
          {/* Photo — étudiant africain */}
          <div className="relative min-h-[500px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80"
              alt="Étudiants africains qui collaborent"
              className="w-full h-full object-cover"
              style={{ borderBottomRightRadius: "8rem" }}
            />
            {/* Badge flottant — originalité */}
            <div className="absolute bottom-10 right-8 bg-white rounded-2xl shadow-xl px-5 py-3.5 max-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-cama" />
                <span className="text-xs font-bold text-ink">Examen sécurisé</span>
              </div>
              <div className="w-full h-1.5 bg-cama-50 rounded-full overflow-hidden">
                <div className="h-full w-[72%] bg-cama rounded-full" />
              </div>
              <p className="text-[10px] text-muted mt-1.5">Timer · 72% du temps écoulé</p>
            </div>
          </div>

          {/* Texte */}
          <div className="flex items-center px-10 lg:px-20 py-20">
            <div>
              <span className="badge bg-cama-50 text-cama mb-4">Module B · Examens</span>
              <h2 className="text-5xl font-light text-ink leading-tight mb-6">
                Préparez et réussissez
                <br />
                <span className="gold-underline font-semibold">vos examens</span>
              </h2>
              <p className="text-muted text-lg leading-relaxed mb-5">
                Le moteur Safe-CAMA offre un environnement sécurisé : timer intégré,
                soumission automatique et sauvegarde locale toutes les 15 secondes.
              </p>
              <p className="text-muted text-lg leading-relaxed mb-10">
                En cas de coupure de courant ou d'interruption réseau, vos réponses
                sont préservées. Zéro perte, zéro stress.
              </p>
              <Link href="/auth/register" className="btn-outline text-sm px-8 py-4">
                Explorer les examens
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Split 2 : texte gauche, image droite ── */}
      <section className="section-surface py-0 overflow-hidden">
        <div className="grid lg:grid-cols-2 items-stretch">

          {/* Texte */}
          <div className="flex items-center px-10 lg:px-20 py-20">
            <div>
              <span className="badge bg-gold/15 text-gold-dark mb-4">Module A · Suivi</span>
              <h2 className="text-5xl font-light text-ink leading-tight mb-6">
                Votre parcours,
                <br />
                <span className="cama-underline font-semibold">tracé précisément</span>
              </h2>
              <p className="text-muted text-lg leading-relaxed mb-5">
                Tableaux de bord pour chaque acteur : progression par chapitre,
                détection de décrochage, historique de consultation en temps réel.
              </p>
              <p className="text-muted text-lg leading-relaxed mb-10">
                Les enseignants voient quels chapitres posent problème avant même
                l'examen. Les étudiants savent exactement où ils en sont.
              </p>
              <Link href="/auth/register" className="btn-outline text-sm px-8 py-4">
                Voir les tableaux de bord
              </Link>
            </div>
          </div>

          {/* Photo — étudiante africaine */}
          <div className="relative min-h-[500px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1595512166451-2b220c20fc08?w=800&q=80"
              alt="Étudiante africaine avec laptop"
              className="w-full h-full object-cover"
              style={{ borderBottomLeftRadius: "8rem" }}
            />
            {/* Badge progression flottant */}
            <div className="absolute top-10 left-8 bg-white rounded-2xl shadow-xl px-5 py-3.5">
              <p className="text-xs font-bold text-ink mb-2">Progression · INF301</p>
              {[
                { name: "Chap. 1", pct: 100, color: "bg-cama" },
                { name: "Chap. 2", pct:  78, color: "bg-cama" },
                { name: "Chap. 3", pct:  42, color: "bg-gold" },
              ].map(({ name, pct, color }) => (
                <div key={name} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] text-subtle w-12">{name}</span>
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted w-8 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
