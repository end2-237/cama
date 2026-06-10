"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen, Video, Cpu, Radio, Brain,
  ShieldCheck, Scale, QrCode, Globe,
  Wifi, Zap, Heart, Users, Award, ChevronDown, ChevronRight,
  GraduationCap, FileText, BarChart3, MessageCircle, Lock, CheckCircle2,
  Lightbulb, ArrowRight, Mail, Phone
} from "lucide-react";
import Footer from "@/components/landing/Footer";

const MODES = [
  {
    icon: FileText,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    title: "Cours PDF",
    subtitle: "Lecture page à page",
    desc: "Documents pédagogiques consultables page par page. Affichage du budget data consommé (optimal pour connexions faibles). Téléchargement possible hors-ligne.",
    points: ["Pagination intelligente", "Data Budgeting affiché en temps réel", "Mode hors-ligne (lecture différée)", "Annotations personnelles"]
  },
  {
    icon: Video,
    color: "bg-purple-50 text-purple-600 border-purple-200",
    title: "Cours Vidéo",
    subtitle: "Adaptif bas-débit",
    desc: "Vidéos pédagogiques avec sélection de qualité (240p → 720p). Mode audio-only pour économiser la data. Transcription textuelle intégrée.",
    points: ["Qualité adaptative (240p/360p/480p/720p)", "Mode audio-only (-85% data)", "Transcription disponible", "Reprise automatique"]
  },
  {
    icon: Cpu,
    color: "bg-green-50 text-green-600 border-green-200",
    title: "Cours Natif",
    subtitle: "Interactif & structuré",
    desc: "Cours entièrement dans CAMA avec blocs interactifs : titres, textes enrichis, points clés, définitions, quiz intégrés. Validation par checkpoint.",
    points: ["Blocs structurés (titre/texte/point/définition)", "Quiz intégrés avec feedback immédiat", "Checkpoints de validation", "Navigation non-linéaire"]
  },
  {
    icon: Radio,
    color: "bg-red-50 text-red-600 border-red-200",
    title: "Classe Virtuelle Live",
    subtitle: "Synchrone en temps réel",
    desc: "Salle de classe virtuelle Teams-style avec vidéo HD, chat en direct, levée de main, partage d'écran (enseignant), et replay automatique après la session.",
    points: ["Vidéo HD avec mode audio-only", "Chat en temps réel + levée de main", "Partage d'écran (enseignant)", "Replay disponible après la session"]
  },
  {
    icon: Brain,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    title: "Prof IA",
    subtitle: "IA ancrée dans le cours",
    desc: "Assistant pédagogique IA ancré sur les ressources du chapitre en cours. Répond uniquement aux questions relatives au contenu — jamais hors sujet.",
    points: ["Réponses ancrées sur le contenu du cours", "Refuse poliment les questions hors-sujet", "Disponible 24h/24, 7j/7", "Historique de conversation"]
  },
];

const VALUES = [
  { icon: Wifi, title: "Optimisé bas-débit", desc: "Conçu pour les réseaux africains : data budgeting, mode audio-only, compression adaptative.", color: "text-cama" },
  { icon: ShieldCheck, title: "Confiance par la preuve", desc: "Chaque action (lecture, examen, délibération) est horodatée et traçable. Diplôme vérifiable par QR.", color: "text-green-600" },
  { icon: Scale, title: "Human-in-the-loop", desc: "L'IA signale, le jury décide. Aucune sanction automatique — l'humain a toujours le dernier mot.", color: "text-indigo-600" },
  { icon: Globe, title: "Accessible partout", desc: "Interface responsive mobile-first. Fonctionne sur smartphone d'entrée de gamme.", color: "text-blue-600" },
  { icon: Heart, title: "Identité africaine", desc: "Motifs Kente, symboles Adinkra, proverbes Akan — un LMS qui parle à ses utilisateurs.", color: "text-red-500" },
  { icon: Zap, title: "Zéro friction pédagogique", desc: "5 modes d'apprentissage fluides, checkpoints automatiques, progression visible en temps réel.", color: "text-amber-600" },
];

const ROLES = [
  {
    icon: GraduationCap, role: "Étudiant", color: "bg-blue-600",
    actions: ["Accéder aux 5 modes de cours", "Passer les examens Safe-CAMA", "Consulter résultats et délibérations", "Télécharger son relevé certifié QR", "Accéder aux replays de classes virtuelles"]
  },
  {
    icon: Users, role: "Enseignant", color: "bg-indigo-600",
    actions: ["Créer et publier des cours (5 modes)", "Programmer des classes virtuelles", "Créer et déployer des examens", "Corriger avec alertes proctoring", "Transmettre au jury pour délibération"]
  },
  {
    icon: Scale, role: "Jury", color: "bg-amber-600",
    actions: ["Valider les résultats (décision humaine)", "Traiter les cas d'intégrité académique", "Certifier les relevés", "Droits d'appel gérés", "Traçabilité complète des décisions"]
  },
  {
    icon: BarChart3, role: "Administrateur", color: "bg-slate-700",
    actions: ["Gestion des utilisateurs et rôles", "Statistiques de plateforme", "Configuration système", "Gestion des UEs et parcours", "Supervision globale"]
  },
];

const FAQ = [
  { q: "Comment fonctionne Safe-CAMA ?", a: "Safe-CAMA est notre moteur d'examen sécurisé. Il passe en plein écran, désactive copier-coller et clic droit, détecte les changements d'onglet, et sauvegarde automatiquement toutes les 15 secondes. Tout est analysé par l'IA et soumis au jury pour décision humaine." },
  { q: "Mes données sont-elles protégées ?", a: "Oui. Le proctoring embarqué analyse les comportements sans transmettre d'images de l'écran ni activer la caméra. Seuls des signaux textuels (heure de l'alerte, type d'événement) sont conservés." },
  { q: "Comment vérifier l'authenticité d'un diplôme ?", a: "Scannez le QR code sur le document ou rendez-vous sur cama.jfn.cm/verifier/[code]. La page publique affiche l'identité de l'étudiant et la traçabilité complète de son parcours." },
  { q: "Le mode hors-ligne est-il disponible ?", a: "Les cours PDF peuvent être téléchargés pour lecture hors-ligne. Les vidéos en mode audio-only consomment environ 15× moins de data. Le mode hors-ligne complet est prévu dans la prochaine version." },
  { q: "Comment rejoindre une classe virtuelle ?", a: "Depuis le dashboard, cliquez sur la bannière 'Live en cours' ou allez dans l'onglet 'Mes Cours'. Le bouton 'Rejoindre' apparaît dès que l'enseignant lance la session." },
];

export default function GuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-cama to-gold" />
          <span className="text-base font-bold text-ink">CA<span className="text-cama">MA</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-muted hover:text-ink transition-colors">Accueil</Link>
          <Link href="/auth/login" className="btn-primary py-2 px-5 text-sm">Se connecter</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cama via-cama-700 to-indigo-900 text-white py-24 px-6">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,.3) 20px, rgba(255,255,255,.3) 22px), repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,.3) 20px, rgba(255,255,255,.3) 22px)`
        }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider mb-6">
            <BookOpen className="w-3.5 h-3.5" /> Guide complet CAMA v2
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Comprendre <span className="text-gold">CAMA</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-8">
            La plateforme LMS de l&apos;Institut JFN — conçue pour l&apos;Afrique, optimisée bas-débit, certifiée par la preuve.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#modes" className="btn-gold py-3 px-6 text-sm">Découvrir les modes</a>
            <a href="#roles" className="btn-outline-white py-3 px-6 text-sm">Mon rôle dans CAMA</a>
          </div>
        </div>
      </section>

      {/* INTRO REFORM */}
      <section className="py-16 px-6 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-cama uppercase tracking-wider mb-4">
                <Lightbulb className="w-4 h-4" /> Pourquoi CAMA existe
              </div>
              <h2 className="text-3xl font-bold text-ink mb-4">
                La réforme académique africaine est en marche
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                L&apos;essor de l&apos;IA générative et la transformation numérique bouleversent l&apos;enseignement supérieur mondial.
                L&apos;Afrique ne peut pas se permettre d&apos;être spectatrice de cette révolution.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                CAMA est né de ce constat : les LMS occidentaux sont conçus pour la fibre optique, pas pour les réseaux mobiles
                d&apos;Afrique centrale. Ils ignorent la réalité du terrain — l&apos;infrastructure, les usages, l&apos;identité culturelle.
              </p>
              <div className="flex items-center gap-3 p-4 bg-cama/5 rounded-2xl border border-cama/20">
                <div className="w-1 h-12 rounded-full bg-cama flex-shrink-0" />
                <p className="text-sm text-ink italic">
                  &ldquo;Le diplôme ne doit plus être un papier — il doit être une preuve vérifiable,
                  traçable et incontestable.&rdquo;
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { pct: "67%", label: "des étudiants africains en zone 3G ou moins" },
                { pct: "5x", label: "moins cher qu'un LMS occidental équivalent" },
                { pct: "100%", label: "des décisions disciplinaires validées par un humain" },
                { pct: "QR", label: "Chaque diplôme vérifiable publiquement en 3 secondes" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4 bg-[#F9FAFB] rounded-2xl p-4 border border-border">
                  <span className="text-2xl font-black text-cama w-16 flex-shrink-0">{s.pct}</span>
                  <p className="text-sm text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5 MODES */}
      <section id="modes" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cama uppercase tracking-wider mb-3">
              <BookOpen className="w-4 h-4" /> 5 Modes d&apos;apprentissage
            </div>
            <h2 className="text-3xl font-bold text-ink mb-3">Un cours, cinq façons d&apos;apprendre</h2>
            <p className="text-muted max-w-xl mx-auto">Chaque chapitre peut combiner plusieurs modes. L&apos;étudiant choisit selon sa connexion, son style, ses contraintes.</p>
          </div>
          <div className="space-y-4">
            {MODES.map((m, i) => (
              <div key={i} className={`bg-white rounded-2xl border p-6 ${m.color.split(' ')[2]}`}>
                <div className="flex items-start gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color.split(' ')[0]} ${m.color.split(' ')[1]} border ${m.color.split(' ')[2]}`}>
                    <m.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-ink text-lg">{m.title}</h3>
                      <span className="text-xs text-muted bg-slate-100 px-2 py-0.5 rounded-full">{m.subtitle}</span>
                    </div>
                    <p className="text-sm text-muted mb-3 leading-relaxed">{m.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {m.points.map((p, j) => (
                        <span key={j} className="text-[11px] flex items-center gap-1 text-slate-600">
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALEURS */}
      <section className="py-20 px-6 bg-white border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink mb-3">Les piliers de CAMA</h2>
            <p className="text-muted max-w-xl mx-auto">6 engagements fondamentaux qui guident chaque décision de conception.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((v, i) => (
              <div key={i} className="feature-card">
                <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4`}>
                  <v.icon className={`w-5 h-5 ${v.color}`} />
                </div>
                <h3 className="font-bold text-ink mb-2">{v.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFE-CAMA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-green-600 uppercase tracking-wider mb-4">
                <Lock className="w-4 h-4" /> Safe-CAMA
              </div>
              <h2 className="text-3xl font-bold text-ink mb-4">Le moteur d&apos;examen sécurisé</h2>
              <p className="text-muted leading-relaxed mb-6">
                Safe-CAMA est notre environnement d&apos;examen sécurisé embarqué. Pas de logiciel à installer —
                il fonctionne directement dans le navigateur, sur n&apos;importe quel appareil.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Lock, t: "Plein écran forcé", d: "Verrouille l'affichage pendant l'examen" },
                  { icon: ShieldCheck, t: "Détection des comportements", d: "Changement d'onglet, copier-coller, clic droit" },
                  { icon: Zap, t: "Sauvegarde automatique", d: "Toutes les 15 secondes — jamais de perte de données" },
                  { icon: Scale, t: "Human-in-the-loop", d: "L'IA signale, le jury décide — jamais de sanction auto" },
                  { icon: Globe, t: "Proctoring embarqué", d: "Aucune image ne quitte l'appareil de l'étudiant" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">{item.t}</p>
                      <p className="text-xs text-muted">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 rounded-3xl p-6 text-white font-mono text-xs space-y-3">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-4">Journal Safe-CAMA — simulé</p>
              {[
                { t: "14:02:01", c: "text-green-400", m: "Examen démarré — INF201 Algorithmique" },
                { t: "14:02:01", c: "text-green-400", m: "Mode plein écran activé" },
                { t: "14:02:01", c: "text-green-400", m: "Surveillance embarquée initialisée" },
                { t: "14:03:15", c: "text-yellow-400", m: "⚠ Tentative de copier détectée (Ctrl+C)" },
                { t: "14:03:15", c: "text-yellow-400", m: "  → Alerte enregistrée pour jury" },
                { t: "14:17:30", c: "text-blue-400", m: "Sauvegarde automatique #8 — OK" },
                { t: "14:32:00", c: "text-slate-400", m: "Temps écoulé — soumission auto" },
                { t: "14:32:01", c: "text-green-400", m: "Résultat transmis — 14.5/20" },
                { t: "14:32:01", c: "text-purple-400", m: "Dossier envoyé au jury pour délibération" },
              ].map((l, i) => (
                <p key={i}><span className="text-slate-500">[{l.t}]</span> <span className={l.c}>{l.m}</span></p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATION */}
      <section className="py-20 px-6 bg-gradient-to-br from-amber-50 to-orange-50 border-y border-amber-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
              <Award className="w-4 h-4" /> Certification & Traçabilité
            </div>
            <h2 className="text-3xl font-bold text-ink mb-3">Confiance par la preuve</h2>
            <p className="text-muted max-w-xl mx-auto">
              Chaque diplôme CAMA est une chaîne de preuves horodatées — de l&apos;inscription à la remise du parchemin.
            </p>
          </div>
          <div className="grid sm:grid-cols-5 gap-2">
            {[
              { n: "1", t: "Inscription", d: "Validée et horodatée" },
              { n: "2", t: "Chapitres", d: "12 checkpoints validés" },
              { n: "3", t: "Examen", d: "Safe-CAMA — aucun incident" },
              { n: "4", t: "Jury", d: "Délibération humaine" },
              { n: "5", t: "Relevé QR", d: "Vérifiable en 3 secondes" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-black text-amber-700">{s.n}</span>
                </div>
                <p className="text-xs font-bold text-ink">{s.t}</p>
                <p className="text-[10px] text-muted">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/verifier/CAMA-U1-2025" className="btn-gold py-3 px-8 text-sm">
              <QrCode className="w-4 h-4" /> Voir un exemple de vérification
            </Link>
          </div>
        </div>
      </section>

      {/* RÔLES */}
      <section id="roles" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink mb-3">4 rôles, une plateforme</h2>
            <p className="text-muted max-w-xl mx-auto">Chaque profil a son espace et ses outils — tout est pensé pour vous.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {ROLES.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${r.color} flex items-center justify-center`}>
                    <r.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-ink text-lg">{r.role}</h3>
                </div>
                <ul className="space-y-2">
                  {r.actions.map((a, j) => (
                    <li key={j} className="text-sm text-muted flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-cama flex-shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white border-y border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink mb-3">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-bold text-ink">{f.q}</span>
                  {openFaq === i ? <ChevronDown className="w-4 h-4 text-muted flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted leading-relaxed border-t border-border pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-cama to-indigo-700 rounded-3xl p-10 text-white text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-white/70" />
            <h2 className="text-3xl font-bold mb-3">Support & Assistance</h2>
            <p className="text-white/75 mb-8 max-w-lg mx-auto">
              Notre équipe est disponible pour vous aider à tirer le meilleur de CAMA.
              Utilisez aussi l&apos;assistant IA intégré pour une aide instantanée.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: MessageCircle, t: "Assistant IA", d: "Disponible 24h/24 dans l'application" },
                { icon: Mail, t: "Email", d: "support@jfn.cm — réponse < 24h" },
                { icon: Phone, t: "Téléphone", d: "+237 6XX XXX XXX (heures ouvrées)" },
              ].map((c, i) => (
                <div key={i} className="bg-white/10 rounded-2xl p-4">
                  <c.icon className="w-5 h-5 mx-auto mb-2 text-white/70" />
                  <p className="text-sm font-bold">{c.t}</p>
                  <p className="text-[11px] text-white/60 mt-1">{c.d}</p>
                </div>
              ))}
            </div>
            <Link href="/auth/login" className="btn-gold py-3 px-8 text-sm">
              Accéder à CAMA <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
