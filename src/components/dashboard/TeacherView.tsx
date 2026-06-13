"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Users, PlusCircle, Edit3, ChevronDown, ChevronRight, Info,
  Radio, Bot, FileText, Video, MonitorPlay, ShieldCheck,
  AlertTriangle, Check, Eye, EyeOff, TrendingUp, Terminal,
  Newspaper, BookMarked, ExternalLink, Play, Sparkles, Inbox, Target,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";
import { uid } from "@/lib/db";
import TeacherCourseDrawer from "@/components/TeacherCourseDrawer";

export default function TeacherView({ tab }: { tab: string }) {
  if (tab === "Évaluations") return <EvalTab />;
  if (tab === "Étudiants")   return <StudentsTab />;
  return <CoursesTab />;
}

/* ════════════════════════════════════════════════════════════
   SALLE DES PROFS — fil éditorial enseignant (colonne gauche)
════════════════════════════════════════════════════════════ */
type TMedia =
  | { kind: "image"; src: string; legend: string }
  | { kind: "live"; src: string; at: string }
  | { kind: "none" };

interface TArticle {
  rubrique: string;
  title: string;
  subtitle: string;
  body: string;
  media: TMedia;
  author: string;
  time: string;
  refs: { label: string; href: string }[];
  cta?: { label: string; href: string };
}

const SALLE_PROFS: TArticle[] = [
  {
    rubrique: "Atelier",
    title: "Scénariser un cours natif qui retient l'attention",
    subtitle: "Alternez titres, points-clés et quiz toutes les 3 sections pour soutenir l'engagement.",
    body: "L'éditeur natif de CAMA pèse moins de 0,05 Mo par chapitre. La pédagogie active — un quiz court après chaque notion — augmente la complétion de 24 % selon les données plateforme. Pensez à conclure chaque chapitre par un point-clé synthétique.",
    media: { kind: "image", src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=640&q=70", legend: "Atelier pédagogique · campus de Yaoundé. © Presse JFN" },
    author: "Service pédagogique",
    time: "Il y a 4 h",
    refs: [
      { label: "Guide de l'éditeur natif", href: "/guide" },
      { label: "Modèles de chapitres prêts à l'emploi", href: "#" },
    ],
    cta: { label: "Ouvrir un de mes cours", href: "/dashboard" },
  },
  {
    rubrique: "Formation",
    title: "Webinaire — Créer des quiz auto-corrigés efficaces",
    subtitle: "Rédiger des distracteurs pertinents et calibrer la difficulté.",
    body: "Session animée par le département pédagogique. Le replay sera publié automatiquement dans votre espace formation. Le mode audio seul reste disponible pour les connexions faibles.",
    media: { kind: "live", src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=640&q=70", at: "Jeudi · 15h00" },
    author: "Cellule e-learning JFN",
    time: "Il y a 1 j",
    refs: [{ label: "S'inscrire au webinaire", href: "#" }],
    cta: { label: "Ajouter à mon agenda", href: "/calendrier" },
  },
  {
    rubrique: "Administration",
    title: "Saisie des notes du semestre S3 avant le 28 juin",
    subtitle: "Les copies corrigées sont automatiquement transmises au jury pour délibération.",
    body: "Aucune note n'est publiée à l'étudiant tant que le jury n'a pas validé. Vérifiez que toutes vos copies « soumises » sont corrigées dans l'onglet Évaluations. Un feedback formatif assisté par IA est disponible hors examen.",
    media: { kind: "none" },
    author: "Scolarité · Service des examens",
    time: "Il y a 2 j",
    refs: [
      { label: "Procédure de transmission au jury", href: "#" },
      { label: "Calendrier des délibérations", href: "/calendrier" },
    ],
    cta: { label: "Voir mes corrections", href: "/dashboard" },
  },
  {
    rubrique: "Bonne pratique",
    title: "Le mode audio seul, allié des zones à faible débit",
    subtitle: "Une transcription IA accompagne chaque vidéo — pensez à la relire.",
    body: "Sur la plateforme, 41 % des lectures vidéo se font en audio seul. La transcription générée automatiquement permet d'apprendre sans télécharger la vidéo. Relisez-la pour corriger les termes techniques spécifiques à votre discipline.",
    media: { kind: "image", src: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=640&q=70", legend: "Studio d'enregistrement léger du campus." },
    author: "Pôle production de contenus",
    time: "Il y a 3 j",
    refs: [{ label: "Optimiser ses vidéos pour le bas débit", href: "#" }],
  },
  {
    rubrique: "Communauté",
    title: "Bibliothèque commune : partagez vos ressources",
    subtitle: "40 exercices d'algèbre linéaire viennent d'être ajoutés en MAT203.",
    body: "Les ressources partagées sont réutilisables par tous les enseignants de la discipline et indexées dans le Prof IA. Déposez vos sujets, corrigés et fiches méthodes pour enrichir le fonds documentaire.",
    media: { kind: "none" },
    author: "Réseau des enseignants JFN",
    time: "Il y a 5 j",
    refs: [{ label: "Accéder à la bibliothèque commune", href: "#" }],
    cta: { label: "Déposer une ressource", href: "#" },
  },
];

function TMediaBlock({ media }: { media: TMedia }) {
  if (media.kind === "none") return null;
  if (media.kind === "image") return (
    <figure className="mt-2">
      <img src={media.src} alt="" className="w-full h-36 object-cover" />
      <figcaption className="text-[10px] text-subtle italic mt-1">{media.legend}</figcaption>
    </figure>
  );
  /* live */
  return (
    <div className="mt-2 relative overflow-hidden group cursor-pointer">
      <img src={media.src} alt="" className="w-full h-36 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-cama text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
        <Radio className="w-2.5 h-2.5" /> Webinaire
      </div>
      <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5">{media.at}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-11 h-11 rounded-full bg-cama flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
      <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-bold">Formation continue des enseignants</p>
    </div>
  );
}

function TeacherFeed() {
  return (
    <aside className="bg-white border-r border-border overflow-x-hidden lg:sticky lg:top-[112px] lg:h-[calc(100vh-112px)] lg:overflow-y-auto">
      <div className="px-4 py-3 border-b-2 border-ink flex items-baseline justify-between">
        <div>
          <p className="text-base font-black text-ink tracking-tight uppercase">Salle des Profs</p>
          <p className="text-[10px] text-subtle">Espace enseignant · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <Newspaper className="w-4 h-4 text-ink" />
      </div>

      {SALLE_PROFS.map((a, i) => (
        <article key={i} className="px-4 py-4 border-b border-border">
          <p className="text-[10px] font-black text-cama uppercase tracking-widest mb-1">{a.rubrique}</p>
          <h3 className="text-sm font-bold text-ink leading-snug hover:underline cursor-pointer">{a.title}</h3>
          <p className="text-[11px] font-medium text-muted italic mt-0.5 leading-snug">{a.subtitle}</p>
          <TMediaBlock media={a.media} />
          <p className="text-[11px] text-muted leading-relaxed mt-2">{a.body}</p>
          {a.refs.length > 0 && (
            <div className="mt-2 border-t border-border/70 pt-1.5">
              <p className="text-[9px] font-bold text-subtle uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <BookMarked className="w-2.5 h-2.5" /> Références
              </p>
              <ul className="space-y-0.5">
                {a.refs.map((r, j) => (
                  <li key={j}>
                    <a href={r.href} className="text-[10px] text-cama hover:underline flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" /> {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[9px] text-subtle">{a.author} · {a.time}</p>
            {a.cta && (
              <Link href={a.cta.href} className="text-[10px] font-bold text-white bg-ink px-2.5 py-1 hover:bg-cama transition-colors">
                {a.cta.label}
              </Link>
            )}
          </div>
        </article>
      ))}

      <div className="px-4 py-3">
        <button className="w-full text-[11px] font-bold text-ink border border-ink py-1.5 hover:bg-ink hover:text-white transition-colors">
          Toutes les actualités enseignants →
        </button>
      </div>
    </aside>
  );
}

/* Coquille 3 colonnes partagée */
function TeacherShell({ children, right }: { children: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr_250px] items-start">
      <TeacherFeed />
      <div className="px-4 py-3 border-r border-border min-h-full">{children}</div>
      <div className="bg-white min-h-full border-l border-border lg:border-l-0">{right}</div>
    </div>
  );
}

/* Panneau gradient réutilisable (col droite) */
function GradientNote({ icon: Icon, title, body }: { icon: typeof Bot; title: string; body: string }) {
  return (
    <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
      <Icon className="w-5 h-5 text-gold mb-1.5" />
      <p className="font-bold text-sm leading-snug mb-1">{title}</p>
      <p className="text-white/60 text-xs leading-relaxed">{body}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MES COURS (création + diffusion + détails)
════════════════════════════════════════════════════════════ */
function CoursesTab() {
  const { db, mutate } = useDB();
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [ueId, setUeId] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  if (!db || !user) return null;

  const myCourses = db.courses;
  const liveNow = db.lives.find((l) => l.status === "encours");
  const published = myCourses.filter((c) => c.published).length;
  const pending = db.attempts.filter((a) => a.status === "soumis").length;
  const totalStudents = 141;

  const create = () => {
    if (!title.trim() || !ueId) return;
    mutate((d) => {
      d.courses.push({ id: uid("c"), ueId, title: title.trim(), teacherId: user.id, published: false, profIA: false, description: "" });
    });
    setTitle(""); setShowNew(false);
  };

  const right = (
    <>
      {/* Notifications */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Notifications</h2>
        <div className="space-y-2.5">
          {[
            { text: "Nadia Mbeki a soumis l'examen INF201", time: "Il y a 12 min", unread: true },
            { text: "3 nouvelles questions sur le forum INF201", time: "Il y a 1 h", unread: true },
            { text: "Replay « API REST » publié automatiquement", time: "Il y a 3 h", unread: false },
            { text: "Rappel : live TD demain à 10h", time: "Hier", unread: false },
          ].map((n, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? "bg-cama" : "bg-border"}`} />
              <div>
                <p className="text-xs text-ink leading-snug">{n.text}</p>
                <p className="text-[10px] text-subtle mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agenda enseignant */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Mon agenda</h2>
        <div className="space-y-2">
          {[
            { date: "Demain 10h", label: "Animer le live TD Arbres", color: "bg-red-400" },
            { date: "Jeudi 15h", label: "Webinaire pédagogie", color: "bg-cama" },
            { date: "28 juin", label: "Clôture saisie notes S3", color: "bg-amber-400" },
            { date: "25 juin", label: "Conseil de département", color: "bg-purple-400" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.color}`} />
              <div>
                <p className="text-[10px] font-bold text-cama leading-none">{a.date}</p>
                <p className="text-xs text-ink">{a.label}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/calendrier" className="block text-[10px] font-bold text-cama hover:underline mt-2">Calendrier académique →</Link>
      </div>

      <GradientNote icon={Sparkles} title="Assistant pédagogique IA"
        body="Générez un plan de chapitre, des quiz ou une transcription. Ouvrez un cours puis l'éditeur pour composer en quelques clics." />
    </>
  );

  return (
    <TeacherShell right={right}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <BookOpen className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Mes Cours</h1>
        <div className="flex-1" />
        <Link href="/tp" className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white text-[11px] font-bold hover:bg-cama transition-colors group">
          <Terminal className="w-3.5 h-3.5 group-hover:text-gold transition-colors" /> TP &amp; VM
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" />
        </Link>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-1.5 bg-cama text-white text-[11px] font-bold hover:bg-cama-700 transition-colors">
          <PlusCircle className="w-3.5 h-3.5" /> Nouveau cours
        </button>
      </div>

      {/* Live en cours */}
      {liveNow && (
        <Link href={`/live/${liveNow.id}`} className="flex items-center gap-3 p-3 mb-2 text-white hover:opacity-95 transition-opacity"
          style={{ background: "linear-gradient(90deg, #7f1d1d, #dc2626)" }}>
          <div className="w-9 h-9 bg-white/15 flex items-center justify-center flex-shrink-0">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-red-100 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> VOTRE LIVE EST EN COURS
            </p>
            <p className="font-bold text-sm truncate">{liveNow.title}</p>
          </div>
          <span className="text-xs font-bold bg-white text-red-600 px-3 py-1.5 flex-shrink-0">Entrer dans la salle</span>
        </Link>
      )}

      {/* Formulaire création */}
      {showNew && (
        <div className="bg-white border-2 border-cama/30 p-4 mb-2 animate-scale-in">
          <p className="text-sm font-bold text-ink mb-3">Créer un cours rattaché à une UE</p>
          <div className="flex gap-2 flex-wrap">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du cours…"
              className="flex-1 min-w-[200px] text-sm border border-border px-4 py-2.5 outline-none focus:border-cama" />
            <select value={ueId} onChange={(e) => setUeId(e.target.value)}
              className="text-sm border border-border px-3 py-2.5 outline-none focus:border-cama bg-white">
              <option value="">Choisir l&apos;UE…</option>
              {db.ues.map((u) => <option key={u.id} value={u.id}>{u.code} — {u.title}</option>)}
            </select>
            <button onClick={create} className="bg-cama text-white text-sm font-bold px-5 hover:bg-cama-700 transition-colors">Créer</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 border border-border divide-x divide-border mb-2 bg-white">
        {[
          { icon: BookOpen, label: "Cours publiés", value: `${published}/${myCourses.length}`, color: "text-cama" },
          { icon: Users, label: "Étudiants suivis", value: String(totalStudents), color: "text-green-600" },
          { icon: Inbox, label: "Copies à corriger", value: String(pending), color: "text-gold-dark" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-2.5 flex items-center gap-2.5">
            <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
            <div>
              <p className={`text-base font-bold leading-none ${color}`}>{value}</p>
              <p className="text-[10px] text-muted leading-tight mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liste des cours */}
      <div className="border border-border divide-y divide-border bg-white">
        {myCourses.map((c) => {
          const ue = db.ues.find((u) => u.id === c.ueId);
          const chs = db.chapters.filter((x) => x.courseId === c.id);
          return (
            <div key={c.id} className="p-3 flex gap-3 hover:bg-cama-50/40 transition-colors group">
              <div className="w-10 h-10 bg-cama-50 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-cama" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-subtle">{ue?.code} · {chs.length} chapitres · {ue?.ects} ECTS</p>
                <h3 className="text-sm font-bold text-ink">{c.title}</h3>
                <div className="flex items-center gap-1.5 my-1 flex-wrap">
                  {chs.some((m) => m.pdf) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark"><FileText className="w-2.5 h-2.5" /> PDF</span>}
                  {chs.some((m) => m.video) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><Video className="w-2.5 h-2.5" /> Vidéo</span>}
                  {chs.some((m) => m.natif) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><MonitorPlay className="w-2.5 h-2.5" /> Natif</span>}
                  {chs.some((m) => m.liveId) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500"><Radio className="w-2.5 h-2.5" /> Live</span>}
                  {c.profIA && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><Bot className="w-2.5 h-2.5" /> Prof IA</span>}
                  <span className="text-[10px] text-subtle ml-0.5 flex items-center gap-1"><Users className="w-3 h-3" /> 47</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 ${c.published ? "bg-green-50 text-green-600" : "bg-surface text-muted"}`}>
                  {c.published ? <><Eye className="w-3 h-3" /> Publié</> : <><EyeOff className="w-3 h-3" /> Brouillon</>}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setDetailId(c.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-muted border border-border hover:border-cama/40 hover:text-cama hover:bg-white transition-all"
                    title="Fiche détaillée & analytics">
                    <Info className="w-3 h-3" /> Détails
                  </button>
                  <Link href={`/enseignant/cours/${c.id}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-cama text-white text-[10px] font-bold hover:bg-cama-700 transition-colors">
                    <Edit3 className="w-3 h-3" /> Gérer
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-subtle mt-3 flex items-center gap-1.5">
        <ChevronRight className="w-3 h-3" /> Chaque cours se diffuse en 5 modes : PDF, vidéo + audio seul, natif léger, live et Prof IA.
      </p>

      <TeacherCourseDrawer courseId={detailId} onClose={() => setDetailId(null)} />
    </TeacherShell>
  );
}

/* ════════════════════════════════════════════════════════════
   ÉVALUATIONS (création + correction)
════════════════════════════════════════════════════════════ */
function EvalTab() {
  const { db, mutate } = useDB();
  const [open, setOpen] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [ueId, setUeId] = useState("");
  const [dur, setDur] = useState("45");
  if (!db) return null;

  const pending = db.attempts.filter((a) => a.status === "soumis").length;
  const flagged = db.attempts.filter((a) => a.alerts.length > 0).length;

  const createExam = () => {
    if (!title.trim() || !ueId) return;
    mutate((d) => {
      d.exams.push({ id: uid("e"), ueId, title: title.trim(), date: new Date().toISOString(),
        durationMin: parseInt(dur) || 45, status: "planifie", questions: [] });
    });
    setTitle(""); setShowNew(false);
  };

  const right = (
    <>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">File de correction</h2>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {[
            { value: String(pending), label: "à corriger", color: "text-gold-dark" },
            { value: String(flagged), label: "signalées", color: "text-red-500" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-2.5 text-center">
              <p className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Intégrité Safe-CAMA</h2>
        <div className="space-y-2">
          {[
            "Plein écran imposé pendant l'épreuve",
            "Copier-coller et clic droit désactivés",
            "Changement d'onglet horodaté et signalé",
            "Sauvegarde auto toutes les 15 s",
          ].map((r, i) => (
            <div key={i} className="flex gap-2 items-start">
              <ShieldCheck className="w-3.5 h-3.5 text-cama flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink leading-snug">{r}</p>
            </div>
          ))}
        </div>
      </div>

      <GradientNote icon={ShieldCheck} title="L'IA signale, vous décidez"
        body="Aucune sanction automatique : les signalements sont indicatifs. Vous corrigez et transmettez au jury, l'étudiant garde un droit d'appel." />
    </>
  );

  return (
    <TeacherShell right={right}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <ShieldCheck className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Évaluations</h1>
        <div className="flex-1" />
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-1.5 bg-cama text-white text-[11px] font-bold hover:bg-cama-700 transition-colors">
          <PlusCircle className="w-3.5 h-3.5" /> Nouvel examen
        </button>
      </div>

      {showNew && (
        <div className="bg-white border-2 border-cama/30 p-4 mb-2 animate-scale-in flex gap-2 flex-wrap">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'examen…"
            className="flex-1 min-w-[200px] text-sm border border-border px-4 py-2.5 outline-none focus:border-cama" />
          <select value={ueId} onChange={(e) => setUeId(e.target.value)}
            className="text-sm border border-border px-3 py-2.5 outline-none bg-white">
            <option value="">UE…</option>
            {db.ues.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
          </select>
          <input value={dur} onChange={(e) => setDur(e.target.value)} type="number" min="5" placeholder="Durée"
            className="w-24 text-sm border border-border px-3 py-2.5 outline-none" />
          <button onClick={createExam} className="bg-cama text-white text-sm font-bold px-5 hover:bg-cama-700 transition-colors">Créer</button>
        </div>
      )}

      <div className="space-y-2">
        {db.exams.map((e) => {
          const ue = db.ues.find((u) => u.id === e.ueId);
          const attempts = db.attempts.filter((a) => a.examId === e.id);
          return (
            <div key={e.id} className="bg-white border border-border overflow-hidden">
              <div className="p-3 flex items-center gap-3 flex-wrap">
                <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${e.status === "ouvert" ? "bg-cama-50" : "bg-surface"}`}>
                  <ShieldCheck className={`w-4 h-4 ${e.status === "ouvert" ? "text-cama" : "text-subtle"}`} />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-[10px] text-subtle">{ue?.code} · {e.durationMin} min · {e.questions.length} questions</p>
                  <p className="font-bold text-ink text-sm">{e.title}</p>
                </div>
                <select
                  value={e.status}
                  onChange={(ev) => mutate((d) => { const x = d.exams.find((y) => y.id === e.id); if (x) x.status = ev.target.value as typeof e.status; })}
                  className={`text-xs font-bold px-3 py-1.5 border-2 outline-none ${
                    e.status === "ouvert" ? "border-green-500 text-green-600 bg-green-50" : "border-border text-muted bg-white"}`}>
                  <option value="planifie">Planifié</option>
                  <option value="ouvert">Ouvert</option>
                  <option value="termine">Terminé</option>
                </select>
                <button onClick={() => setOpen(open === e.id ? null : e.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-cama border-2 border-cama/30 px-3 py-1.5 hover:bg-cama-50 transition-colors">
                  {attempts.length} copie(s) <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open === e.id ? "rotate-180" : ""}`} />
                </button>
              </div>
              {open === e.id && (
                <div className="border-t border-border bg-surface p-3 space-y-3 animate-fade-up">
                  {attempts.length === 0 && <p className="text-sm text-muted text-center py-3">Aucune copie soumise pour le moment.</p>}
                  {attempts.map((a) => <AttemptCard key={a.id} attemptId={a.id} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TeacherShell>
  );
}

function AttemptCard({ attemptId }: { attemptId: string }) {
  const { db, mutate } = useDB();
  const [note, setNote] = useState("");
  const [fb, setFb] = useState("");
  const a = db?.attempts.find((x) => x.id === attemptId);
  if (!db || !a) return null;
  const exam = db.exams.find((e) => e.id === a.examId);
  const studentName = a.studentId === "u1" ? "Jean-Paul Mbarga" : a.studentId === "u9" ? "Nadia Mbeki" : "Étudiant " + a.studentId;
  const open = exam?.questions.filter((q) => q.type === "ouverte") || [];

  const grade = () => {
    const n = parseFloat(note);
    if (isNaN(n)) return;
    mutate((d) => {
      const x = d.attempts.find((y) => y.id === attemptId);
      if (x) { x.status = "corrige"; x.score = Math.min(20, Math.max(0, n)); x.feedback = fb; }
      if (exam && !d.results.some((r) => r.studentId === a.studentId && r.ueId === exam.ueId)) {
        const ue = d.ues.find((u) => u.id === exam.ueId);
        d.results.push({ id: `r_${attemptId}`, studentId: a.studentId, ueId: exam.ueId,
          note: Math.min(20, Math.max(0, n)), credits: ue?.ects || 0, validatedByJury: false });
      }
    });
  };

  return (
    <div className="bg-white border border-border p-4">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <p className="text-sm font-bold text-ink flex-1">{studentName}</p>
        {a.alerts.length > 0 ? (
          <span className="badge bg-gold/10 text-gold-dark text-[10px]"><AlertTriangle className="w-3 h-3" /> {a.alerts.length} signalement(s)</span>
        ) : (
          <span className="badge bg-green-50 text-green-600 text-[10px]"><Check className="w-3 h-3" /> Aucun incident</span>
        )}
        <span className={`badge text-[10px] ${a.status === "corrige" ? "bg-green-50 text-green-600" : "bg-cama-50 text-cama"}`}>
          {a.status === "corrige" ? `Corrigé · ${a.score}/20` : `QCM auto : ${a.score ?? "—"}/20`}
        </span>
      </div>

      {a.alerts.length > 0 && (
        <div className="bg-gold/5 border border-gold/20 p-3 mb-3 space-y-1">
          {a.alerts.map((al, i) => (
            <p key={i} className="text-[11px] text-gold-dark">⚠ {al.time} — {al.detail}</p>
          ))}
          <p className="text-[10px] text-muted italic">L&apos;IA signale, vous décidez — l&apos;étudiant dispose d&apos;un droit d&apos;appel.</p>
        </div>
      )}

      {open.map((q) => (
        <div key={q.id} className="mb-3">
          <p className="text-xs font-semibold text-ink mb-1">{q.text}</p>
          <p className="text-xs text-muted bg-surface p-3 leading-relaxed">
            {(a.answers[q.id] as string) || <em className="text-subtle">Pas de réponse</em>}
          </p>
        </div>
      ))}

      {a.status !== "corrige" && (
        <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-border">
          <input value={note} onChange={(e) => setNote(e.target.value)} type="number" min="0" max="20" placeholder="Note /20"
            className="w-24 text-xs border border-border px-3 py-2 outline-none focus:border-cama" />
          <input value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Feedback formatif (assisté IA hors examen)…"
            className="flex-1 min-w-[180px] text-xs border border-border px-3 py-2 outline-none focus:border-cama" />
          <button onClick={grade} className="bg-cama text-white text-xs font-bold px-4 py-2 hover:bg-cama-700 transition-colors flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Corriger &amp; transmettre</button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ÉTUDIANTS (suivi + analytics décrochage)
════════════════════════════════════════════════════════════ */
function StudentsTab() {
  const { db } = useDB();
  if (!db) return null;
  const students = [
    { id: "u1", name: "Jean-Paul Mbarga", level: "L2", ue: "INF201" },
    { id: "u9", name: "Nadia Mbeki", level: "L2", ue: "INF201" },
    { id: "u10", name: "Oumarou Moussa", level: "L2", ue: "INF202" },
    { id: "u11", name: "Carine Beyala", level: "L2", ue: "INF201" },
    { id: "u12", name: "Fatou Sall", level: "L2", ue: "INF202" },
  ];

  const computed = students.map((s) => {
    const done = db.progress.filter((p) => p.studentId === s.id).length;
    const total = db.chapters.length;
    /* valeurs représentatives stables pour la démo */
    const seed = s.id.charCodeAt(s.id.length - 1);
    const pct = s.id === "u1" ? (total ? Math.round((done / total) * 100) : 0) : 20 + (seed * 7) % 75;
    return { ...s, done, total, pct, risk: pct < 25 };
  });
  const atRisk = computed.filter((s) => s.risk).length;
  const avg = Math.round(computed.reduce((a, s) => a + s.pct, 0) / computed.length);

  const right = (
    <>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Vue d&apos;ensemble</h2>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {[
            { value: `${avg}%`, label: "progression moy.", color: "text-cama" },
            { value: String(atRisk), label: "à risque", color: "text-red-500" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-2.5 text-center">
              <p className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Répartition</h2>
        <div className="space-y-2.5">
          {[
            { label: "En progression", value: computed.filter((s) => s.pct >= 50).length, color: "bg-green-500" },
            { label: "À surveiller", value: computed.filter((s) => s.pct >= 25 && s.pct < 50).length, color: "bg-amber-400" },
            { label: "Décrochage", value: atRisk, color: "bg-red-400" },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted">{r.label}</span>
                <span className="font-bold text-ink">{r.value}</span>
              </div>
              <div className="h-1.5 bg-surface overflow-hidden">
                <div className={`h-full ${r.color}`} style={{ width: `${(r.value / computed.length) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <GradientNote icon={Target} title="Analytics prédictif"
        body="L'alerte décrochage repose sur la consultation horodatée des chapitres. Contactez tôt un étudiant inactif pour maximiser sa réussite." />
    </>
  );

  return (
    <TeacherShell right={right}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <Users className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Suivi des étudiants</h1>
      </div>

      <div className="border border-border divide-y divide-border bg-white">
        {computed.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3">
            <div className="w-9 h-9 rounded-full bg-cama-50 text-cama flex items-center justify-center text-xs font-bold flex-shrink-0">
              {s.name.split(" ").map((x) => x[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{s.name} <span className="text-[10px] text-subtle">· {s.level} · {s.ue}</span></p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-1.5 bg-surface overflow-hidden">
                  <div className={`h-full ${s.risk ? "bg-red-400" : "bg-cama"}`} style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-[10px] text-muted">{s.pct}%</span>
              </div>
            </div>
            {s.risk ? (
              <span className="badge bg-red-50 text-red-500 text-[10px]"><AlertTriangle className="w-3 h-3" /> Décrochage</span>
            ) : (
              <span className="badge bg-green-50 text-green-600 text-[10px]"><TrendingUp className="w-3 h-3" /> En progression</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-subtle mt-3 flex items-center gap-1.5">
        <ChevronRight className="w-3 h-3" /> Données issues de la consultation horodatée des chapitres — analytics prédictif anti-décrochage.
      </p>
    </TeacherShell>
  );
}
