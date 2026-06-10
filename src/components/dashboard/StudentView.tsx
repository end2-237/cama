"use client";

import Link from "next/link";
import {
  BookOpen, Clock, ChevronRight, Play, Radio, ShieldCheck,
  FileText, Video, MonitorPlay, Bot, CheckCircle2, TrendingUp,
  Star, Award, GraduationCap, QrCode, AlertCircle, Calendar,
  Newspaper, Megaphone, Users, Zap, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";

export default function StudentView({ tab }: { tab: string }) {
  if (tab === "Examens")   return <ExamsTab />;
  if (tab === "Résultats") return <ResultsTab />;
  return <CoursesTab />;
}

/* ════ FIL D'ACTUALITÉS CAMPUS ════ */
const NEWS = [
  {
    type: "annonce",
    badge: "Annonce",
    badgeColor: "bg-cama/10 text-cama",
    icon: Megaphone,
    iconColor: "text-cama",
    title: "Calendrier des soutenances S5",
    body: "Les soutenances de mémoire de Licence 3 sont programmées du 12 au 20 juillet. Consultez le planning sur l'ENT.",
    time: "Il y a 2h",
    author: "Administration",
  },
  {
    type: "live",
    badge: "Live à venir",
    badgeColor: "bg-red-50 text-red-500",
    icon: Radio,
    iconColor: "text-red-500",
    title: "TD Arbres binaires — INF201",
    body: "M. Amina Bello animera un TD interactif demain à 10h. Préparez les exercices 3.4 à 3.8.",
    time: "Demain 10h00",
    author: "Pr. Amina Bello",
  },
  {
    type: "article",
    badge: "Article",
    badgeColor: "bg-amber-50 text-amber-700",
    icon: Newspaper,
    iconColor: "text-amber-600",
    title: "JFN parmi les 10 meilleures universités tech d'Afrique centrale",
    body: "Le classement 2025 QS Africa Universities positionne l'Institut JFN en 7e place pour l'informatique et l'ingénierie.",
    time: "Il y a 1 jour",
    author: "Presse JFN",
  },
  {
    type: "event",
    badge: "Événement",
    badgeColor: "bg-green-50 text-green-600",
    icon: Users,
    iconColor: "text-green-600",
    title: "Hackathon AfriCode 2025",
    body: "48h pour résoudre un problème d'agriculture digitale. Inscriptions ouvertes jusqu'au 30 juin. Prix : 500 000 FCFA.",
    time: "30 juin",
    author: "Club Informatique JFN",
  },
  {
    type: "annonce",
    badge: "Info scolarité",
    badgeColor: "bg-purple-50 text-purple-600",
    icon: Zap,
    iconColor: "text-purple-500",
    title: "Dépôt des demandes de bourse — clôture 15 juillet",
    body: "Les demandes de bourse d'excellence pour l'année 2025-2026 sont ouvertes. Dossier complet à soumettre via le portail.",
    time: "Il y a 3 jours",
    author: "Service Scolarité",
  },
  {
    type: "article",
    badge: "Ressource",
    badgeColor: "bg-blue-50 text-blue-600",
    icon: FileText,
    iconColor: "text-blue-600",
    title: "Nouvelles ressources en Mathématiques L2",
    body: "40 exercices corrigés d'algèbre linéaire ont été ajoutés à la bibliothèque numérique par le département MAT.",
    time: "Il y a 4 jours",
    author: "Dép. Mathématiques",
  },
];

function NewsFeed() {
  return (
    <aside className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Actualités campus</h2>
        <button className="text-[10px] text-cama hover:underline flex items-center gap-0.5">Tout voir <ExternalLink className="w-2.5 h-2.5" /></button>
      </div>
      {NEWS.map((n, i) => (
        <div key={i} className="bg-white rounded-2xl border border-border p-4 hover:border-cama/20 hover:shadow-sm transition-all cursor-pointer group">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${n.badgeColor.split(" ")[0]}`}>
              <n.icon className={`w-4 h-4 ${n.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${n.badgeColor}`}>{n.badge}</span>
              </div>
              <p className="text-xs font-bold text-ink leading-snug group-hover:text-cama transition-colors line-clamp-1">{n.title}</p>
              <p className="text-[11px] text-muted leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[9px] text-subtle">{n.author}</p>
                <p className="text-[9px] text-subtle">{n.time}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}

/* ════ MES COURS ════ */
function CoursesTab() {
  const { db } = useDB();
  const { user } = useAuth();
  if (!db || !user) return null;

  const courses = db.courses.filter((c) => c.published);
  const doneIds = new Set(db.progress.filter((p) => p.studentId === user.id).map((p) => p.chapterId));
  const liveNow = db.lives.find((l) => l.status === "encours");

  const stats = courses.map((c) => {
    const chs = db.chapters.filter((x) => x.courseId === c.id);
    const done = chs.filter((x) => doneIds.has(x.id)).length;
    return { course: c, total: chs.length, done, pct: chs.length ? Math.round((done / chs.length) * 100) : 0 };
  });
  const avg = stats.length ? Math.round(stats.reduce((a, s) => a + s.pct, 0) / stats.length) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-5 items-start">

      {/* ── COL GAUCHE : Actualités campus ── */}
      <NewsFeed />

      {/* ── COL CENTRE : Cours ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <BookOpen className="w-6 h-6 text-ink" strokeWidth={1.5} />
          <h1 className="text-2xl font-light text-ink">Mes Cours</h1>
        </div>

        {/* Live en cours */}
        {liveNow && (
          <Link href={`/live/${liveNow.id}`}
            className="flex items-center gap-4 rounded-2xl p-4 mb-5 text-white hover:opacity-95 transition-opacity"
            style={{ background: "linear-gradient(90deg, #1E1B4B, #4F46E5)" }}>
            <div className="w-11 h-11 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 text-red-300 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-300 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> EN DIRECT MAINTENANT
              </p>
              <p className="font-bold truncate">{liveNow.title}</p>
            </div>
            <span className="btn-gold py-2 px-4 text-xs flex-shrink-0">Rejoindre</span>
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: TrendingUp,   label: "Progression moy.", value: `${avg}%`, color: "text-cama", bg: "bg-cama-50" },
            { icon: CheckCircle2, label: "Chapitres validés", value: String(doneIds.size), color: "text-green-600", bg: "bg-green-50" },
            { icon: Star,         label: "Cours actifs", value: String(courses.length), color: "text-gold-dark", bg: "bg-gold/10" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className={`text-base font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cours */}
        <div className="space-y-3">
          {stats.map(({ course: c, total, done, pct }) => {
            const ue = db.ues.find((u) => u.id === c.ueId);
            const modes = db.chapters.filter((x) => x.courseId === c.id);
            return (
              <Link key={c.id} href={`/cours/${c.id}`}
                className="bg-white rounded-2xl border border-border p-4 flex gap-4 hover:shadow-lg hover:border-cama/20 transition-all duration-200 group block">
                <div className="w-11 h-11 rounded-xl bg-cama-50 flex items-center justify-center flex-shrink-0 group-hover:bg-cama transition-colors">
                  <BookOpen className="w-5 h-5 text-cama group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-subtle">{ue?.code} · {ue?.ects} ECTS · {ue?.semestre}</p>
                  <h3 className="text-sm font-bold text-ink group-hover:text-cama transition-colors mb-1">{c.title}</h3>
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {modes.some((m) => m.pdf) && <span className="badge bg-gold/10 text-gold-dark text-[9px]"><FileText className="w-2.5 h-2.5" /> PDF</span>}
                    {modes.some((m) => m.video) && <span className="badge bg-cama-50 text-cama text-[9px]"><Video className="w-2.5 h-2.5" /> Vidéo</span>}
                    {modes.some((m) => m.natif) && <span className="badge bg-cama-50 text-cama text-[9px]"><MonitorPlay className="w-2.5 h-2.5" /> Natif</span>}
                    {modes.some((m) => m.liveId) && <span className="badge bg-red-50 text-red-500 text-[9px]"><Radio className="w-2.5 h-2.5" /> Live</span>}
                    {c.profIA && <span className="badge bg-cama-50 text-cama text-[9px]"><Bot className="w-2.5 h-2.5" /> Prof IA</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cama to-cama-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-cama">{pct}%</span>
                    <span className="text-[10px] text-subtle">{done}/{total}</span>
                  </div>
                </div>
                <div className="self-center w-8 h-8 rounded-full bg-cama text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── COL DROITE : Notifications + Prof IA ── */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-border p-4">
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Notifications</h2>
          <div className="space-y-3">
            {db.notifs.filter((n) => n.userId === user.id).map((n) => (
              <div key={n.id} className="flex gap-3 items-start">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-border" : "bg-cama"}`} />
                <div>
                  <p className="text-xs text-ink leading-snug">{n.text}</p>
                  <p className="text-[10px] text-subtle mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden p-4 text-white"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
          <Bot className="w-6 h-6 text-gold mb-2" />
          <p className="font-bold text-sm leading-snug mb-1">Prof IA disponible</p>
          <p className="text-white/60 text-xs leading-relaxed">Questions, exercices, résumés — ancré sur vos cours, ultra-léger en data. Ouvrez un cours pour l&apos;utiliser.</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Agenda</h2>
          <div className="space-y-2">
            {[
              { date: "Demain 10h", label: "Live TD Arbres binaires", color: "bg-red-400" },
              { date: "15 juin", label: "Examen INF201", color: "bg-cama" },
              { date: "30 juin", label: "Clôture bourse excellence", color: "bg-amber-400" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.color}`} />
                <div>
                  <p className="text-[10px] font-bold text-cama">{a.date}</p>
                  <p className="text-xs text-ink">{a.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════ EXAMENS ════ */
function ExamsTab() {
  const { db } = useDB();
  const { user } = useAuth();
  if (!db || !user) return null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-7 h-7 text-ink" strokeWidth={1.5} />
        <h1 className="text-3xl font-light text-ink">Mes Examens</h1>
      </div>
      <div className="space-y-3">
        {db.exams.map((e) => {
          const ue = db.ues.find((u) => u.id === e.ueId);
          const attempt = db.attempts.find((a) => a.examId === e.id && a.studentId === user.id);
          return (
            <div key={e.id} className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 flex-wrap">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                e.status === "ouvert" ? "bg-cama-50" : "bg-surface"}`}>
                <ShieldCheck className={`w-5 h-5 ${e.status === "ouvert" ? "text-cama" : "text-subtle"}`} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-[10px] text-subtle">{ue?.code} · {e.durationMin} min · {e.questions.length} questions</p>
                <p className="font-bold text-ink text-sm">{e.title}</p>
                <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(e.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              {attempt ? (
                <div className="text-right">
                  <span className="badge bg-green-50 text-green-600 text-[10px]">
                    {attempt.status === "corrige" ? `Corrigé · ${attempt.score}/20` : `Soumis${attempt.score !== undefined ? ` · QCM ${attempt.score}/20` : ""}`}
                  </span>
                  {attempt.alerts.length > 0 && (
                    <p className="text-[10px] text-gold-dark flex items-center gap-1 mt-1 justify-end">
                      <AlertCircle className="w-3 h-3" /> {attempt.alerts.length} signalement(s)
                    </p>
                  )}
                </div>
              ) : e.status === "ouvert" ? (
                <Link href={`/examen/${e.id}`} className="btn-primary py-2 px-5 text-xs gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Passer l&apos;examen
                </Link>
              ) : (
                <span className="badge bg-surface text-muted text-[10px]">{e.status === "planifie" ? "Planifié" : "Terminé"}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════ RÉSULTATS ════ */
function ResultsTab() {
  const { db } = useDB();
  const { user } = useAuth();
  if (!db || !user) return null;
  const results = db.results.filter((r) => r.studentId === user.id);
  const validated = results.filter((r) => r.validatedByJury);
  const totalCredits = validated.reduce((a, r) => a + r.credits, 0);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-7 h-7 text-ink" strokeWidth={1.5} />
        <h1 className="text-3xl font-light text-ink">Mes Résultats</h1>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
        <table className="w-full">
          <thead><tr className="bg-surface border-b border-border">
            <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-5 py-3">UE</th>
            <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-5 py-3">Note</th>
            <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-5 py-3">Crédits</th>
            <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-5 py-3">Jury</th>
          </tr></thead>
          <tbody>
            {results.map((r) => {
              const ue = db.ues.find((u) => u.id === r.ueId);
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-ink">{ue?.title}</p>
                    <p className="text-[10px] text-subtle">{ue?.code}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-bold ${r.note >= 10 ? "text-green-600" : "text-red-500"}`}>{r.note}/20</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-ink">{r.note >= 10 ? r.credits : 0} ECTS</td>
                  <td className="px-5 py-3">
                    {r.validatedByJury
                      ? <span className="badge bg-green-50 text-green-600 text-[10px]"><CheckCircle2 className="w-3 h-3" /> Validé</span>
                      : <span className="badge bg-gold/10 text-gold-dark text-[10px]"><Clock className="w-3 h-3" /> En délibération</span>}
                  </td>
                </tr>
              );
            })}
            {results.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">Aucun résultat publié pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl p-6 text-white flex items-center gap-5 flex-wrap"
        style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-7 h-7 text-gold" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold">Relevé & certification vérifiable</p>
          <p className="text-white/60 text-sm">{totalCredits} crédits ECTS validés par le jury · document à QR code authentifiable</p>
        </div>
        <Link href="/diplome" className="btn-gold py-2.5 px-5 text-sm gap-2 flex-shrink-0">
          <QrCode className="w-4 h-4" /> Voir mon relevé
        </Link>
      </div>
      <p className="text-[10px] text-subtle mt-3 flex items-center gap-1.5">
        <ChevronRight className="w-3 h-3" /> Confiance par la preuve : chaque action de votre parcours est horodatée et rattachée au document.
      </p>
    </div>
  );
}
