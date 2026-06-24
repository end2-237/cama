"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Sparkles, CalendarClock, MapPin, Users, Check, GraduationCap,
  Clock, PlayCircle, CheckCircle2, Lock, Star, Trophy, ChevronRight, BookOpen,
  Target, Wifi, Building2, MessageSquare, Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  MODE_LABEL, fetchExtraCourses, fetchMyEnrollments, enrollExtra, updateEnrollment,
} from "@/lib/extra";
import type { DBExtraCourse, DBExtraEnrollment } from "@/lib/supabase";

const MODE_ICON = { online: Wifi, hybride: MapPin, presentiel: Building2 } as const;
const EXTRA_IMG: Record<string, string> = {
  "Soft skills":     "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=70",
  "Langues":         "https://images.unsplash.com/photo-1543109740-4bdb38fda756?w=1200&q=70",
  "Entrepreneuriat": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=70",
  "Tech":            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=70",
  "Arts & Culture":  "https://images.unsplash.com/photo-1499415479124-43c32433a620?w=1200&q=70",
  "Autre":           "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&q=70",
};

/* Génère un parcours pédagogique structuré à partir des métadonnées du cours. */
function buildSyllabus(c: DBExtraCourse) {
  const n = Math.max(1, c.sessions_count);
  const phases = [
    { label: "Découverte & fondamentaux", obj: "Comprendre les bases et le vocabulaire clé." },
    { label: "Mise en pratique guidée", obj: "Appliquer les notions sur des cas concrets." },
    { label: "Approfondissement", obj: "Explorer les techniques avancées du domaine." },
    { label: "Projet & restitution", obj: "Consolider via un livrable évalué." },
  ];
  return Array.from({ length: n }, (_, i) => {
    const phase = phases[Math.min(phases.length - 1, Math.floor((i / n) * phases.length))];
    return {
      idx: i,
      title: `Séance ${i + 1} — ${phase.label}`,
      objective: phase.obj,
      duration: "≈ 2 h",
    };
  });
}

export default function ExtraCoursePlayer() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<DBExtraCourse | null>(null);
  const [enr, setEnr] = useState<DBExtraEnrollment | null>(null);
  const [fetching, setFetching] = useState(true);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); }, [loading, user, router]);

  const reload = useCallback(async () => {
    if (!user || !id) return;
    const [all, mine] = await Promise.all([fetchExtraCourses(true), fetchMyEnrollments(user.id)]);
    const c = all.find((x) => x.id === id) ?? null;
    setCourse(c);
    setEnr(mine.find((m) => m.extra_course_id === id) ?? null);
    setFetching(false);
  }, [user, id]);
  useEffect(() => { reload(); }, [reload]);

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 className="w-7 h-7 animate-spin text-cama" />
    </div>
  );
  if (!course || !user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
      <p className="text-sm font-bold text-ink">Cours introuvable.</p>
      <Link href="/etudiant/parascolaire" className="text-xs font-bold text-cama hover:underline">← Retour au parascolaire</Link>
    </div>
  );

  const syllabus = buildSyllabus(course);
  const total = syllabus.length;
  const progress = enr?.progress ?? 0;
  const completedCount = Math.round((progress / 100) * total);
  const isDone = (i: number) => i < completedCount;
  const isUnlocked = (i: number) => i <= completedCount;
  const ModeIcon = MODE_ICON[course.mode];
  const img = EXTRA_IMG[course.category] ?? EXTRA_IMG["Autre"];
  const cur = syllabus[active];

  const ensureEnrolled = async (): Promise<DBExtraEnrollment | null> => {
    if (enr) return enr;
    await enrollExtra(course.id, user.id);
    const mine = await fetchMyEnrollments(user.id);
    const fresh = mine.find((m) => m.extra_course_id === course.id) ?? null;
    setEnr(fresh);
    return fresh;
  };

  const validateSession = async (i: number) => {
    setSaving(true);
    const e = await ensureEnrolled();
    if (!e) { setSaving(false); return; }
    const newCompleted = Math.max(completedCount, i + 1);
    const newProgress = Math.round((newCompleted / total) * 100);
    const status = newProgress >= 100 ? "termine" : "en_cours";
    await updateEnrollment(e.id, { progress: newProgress, status });
    await reload();
    if (i + 1 < total) setActive(i + 1);
    setSaving(false);
  };

  const rate = async (stars: number) => {
    if (!enr) return;
    await updateEnrollment(enr.id, { satisfaction: stars });
    reload();
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/etudiant/parascolaire" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Parascolaire
          </Link>
          <div className="w-px h-5 bg-border" />
          <Sparkles className="w-4 h-4" style={{ color: course.color }} />
          <span className="text-sm font-bold text-ink truncate">{course.title}</span>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-1.5 bg-surface rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: course.color }} />
            </div>
            <span className="text-xs font-bold" style={{ color: course.color }}>{progress}%</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden text-white">
        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${course.color}F0, #1E1B4BF0)` }} />
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 py-7">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">{course.category}</span>
            {course.code && <span className="text-[10px] font-bold text-white/70">{course.code}</span>}
            <span className="flex items-center gap-1 text-[10px] font-bold text-white/70"><ModeIcon className="w-3 h-3" /> {MODE_LABEL[course.mode]}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight max-w-2xl">{course.title}</h1>
          {course.description && <p className="text-white/70 text-sm mt-2 max-w-2xl leading-relaxed">{course.description}</p>}
          <div className="flex items-center gap-4 mt-4 flex-wrap text-xs text-white/80">
            {course.instructor_name && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {course.instructor_name}</span>}
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {total} séances</span>
            <span className="flex items-center gap-1.5"><CalendarClock className="w-4 h-4" /> {course.day} · {course.start_time}–{course.end_time}</span>
            {course.room && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {course.room}</span>}
          </div>
        </div>
      </div>

      {/* 3-col layout */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-6 items-start">

        {/* ── Sidebar gauche : parcours ── */}
        <aside className="lg:sticky lg:top-[72px] space-y-3">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-ink">Parcours</p>
              <span className="text-[10px] font-bold text-muted">{completedCount}/{total}</span>
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
              {syllabus.map((s) => {
                const done = isDone(s.idx);
                const unlocked = isUnlocked(s.idx);
                const current = active === s.idx;
                return (
                  <button key={s.idx} onClick={() => unlocked && setActive(s.idx)} disabled={!unlocked}
                    className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors ${
                      current ? "bg-surface" : unlocked ? "hover:bg-surface" : "opacity-50 cursor-not-allowed"}`}
                    style={current ? { borderLeft: `3px solid ${course.color}` } : undefined}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: done ? course.color : "transparent", border: done ? "none" : "1.5px solid #e5e7eb" }}>
                      {done ? <Check className="w-3.5 h-3.5 text-white" /> : unlocked ? <span className="text-[10px] font-bold text-muted">{s.idx + 1}</span> : <Lock className="w-3 h-3 text-subtle" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] font-semibold leading-snug ${current ? "text-ink" : "text-muted"}`}>{s.title}</p>
                      <p className="text-[10px] text-subtle flex items-center gap-1 mt-0.5"><Clock className="w-2.5 h-2.5" /> {s.duration}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-border rounded-xl p-4 grid grid-cols-2 gap-3">
            {[
              { icon: Target, label: "Progression", value: `${progress}%` },
              { icon: BookOpen, label: "Séances", value: String(total) },
              { icon: Clock, label: "Durée", value: `~${total * 2}h` },
              { icon: Trophy, label: "Statut", value: progress >= 100 ? "Terminé" : "En cours" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <s.icon className="w-4 h-4 flex-shrink-0" style={{ color: course.color }} />
                <div>
                  <p className="text-sm font-bold text-ink leading-none">{s.value}</p>
                  <p className="text-[10px] text-muted mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Contenu central ── */}
        <div className="space-y-4">
          {!enr && (
            <div className="rounded-xl p-5 text-white flex items-center gap-4 flex-wrap" style={{ background: `linear-gradient(120deg, ${course.color}, #1E1B4B)` }}>
              <PlayCircle className="w-8 h-8 flex-shrink-0" />
              <div className="flex-1 min-w-[180px]">
                <p className="font-bold">Prêt à démarrer ce cours ?</p>
                <p className="text-white/70 text-xs">Inscrivez-vous pour suivre votre progression séance par séance.</p>
              </div>
              <button onClick={() => validateSession(0)} disabled={saving}
                className="bg-white text-ink font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />} Commencer le cours
              </button>
            </div>
          )}

          {/* Séance courante */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: course.color }}>Séance {active + 1} / {total}</p>
              <h2 className="text-xl font-bold text-ink mt-1">{cur.title}</h2>
              <p className="text-sm text-muted mt-1 flex items-center gap-2"><Target className="w-4 h-4" style={{ color: course.color }} /> {cur.objective}</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Bloc contenu illustratif */}
              <div className="prose-sm">
                <p className="text-sm text-ink leading-relaxed">
                  Cette séance fait partie du programme <strong>{course.title}</strong>. Suivez le déroulé,
                  réalisez les activités proposées par {course.instructor_name ?? "l'intervenant"}, puis validez
                  le point d&apos;étape pour débloquer la suite.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { icon: BookOpen, t: "Support", d: "Notes & ressources de la séance" },
                  { icon: Users, t: "Atelier", d: "Activité pratique en groupe" },
                  { icon: MessageSquare, t: "Échange", d: "Questions avec l'intervenant" },
                ].map((b) => (
                  <div key={b.t} className="border border-border rounded-lg p-3">
                    <b.icon className="w-5 h-5 mb-2" style={{ color: course.color }} />
                    <p className="text-sm font-bold text-ink">{b.t}</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-snug">{b.d}</p>
                  </div>
                ))}
              </div>

              {/* Validation / progression */}
              <div className="border-t border-border pt-4 flex items-center justify-between flex-wrap gap-3">
                {isDone(active) ? (
                  <span className="flex items-center gap-2 text-sm font-bold text-green-600"><CheckCircle2 className="w-5 h-5" /> Séance validée</span>
                ) : (
                  <p className="text-xs text-muted">Validez cette séance pour enregistrer votre progression.</p>
                )}
                <div className="flex items-center gap-2">
                  {!isDone(active) && (
                    <button onClick={() => validateSession(active)} disabled={saving}
                      className="text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2" style={{ background: course.color }}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Valider la séance
                    </button>
                  )}
                  {active + 1 < total && isDone(active) && (
                    <button onClick={() => setActive(active + 1)}
                      className="border border-border text-ink font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-surface transition-colors flex items-center gap-1">
                      Séance suivante <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Félicitations + satisfaction */}
          {progress >= 100 && (
            <div className="bg-white border-2 rounded-xl p-5 text-center" style={{ borderColor: course.color }}>
              <Trophy className="w-9 h-9 mx-auto mb-2" style={{ color: course.color }} />
              <p className="text-base font-bold text-ink">Cours terminé — bravo !</p>
              <p className="text-xs text-muted mt-1">Vous avez complété l&apos;ensemble des séances de {course.title}.</p>
              <div className="mt-3">
                <p className="text-[11px] font-bold text-muted mb-1.5">Votre satisfaction</p>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => rate(n)} className="p-0.5 hover:scale-110 transition-transform">
                      <Star className={`w-6 h-6 ${(enr?.satisfaction ?? 0) >= n ? "fill-gold text-gold" : "text-border"}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar droite : intervenant + infos ── */}
        <aside className="lg:sticky lg:top-[72px] space-y-3">
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-ink mb-3">Intervenant</p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: course.color }}>
                {(course.instructor_name ?? "JFN").split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink truncate">{course.instructor_name ?? "Équipe JFN"}</p>
                <p className="text-[11px] text-muted">{course.category}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-ink mb-1">Informations</p>
            {[
              { icon: CalendarClock, label: course.day && course.start_time ? `${course.day} · ${course.start_time}–${course.end_time}` : "Horaire à confirmer" },
              { icon: MODE_ICON[course.mode], label: MODE_LABEL[course.mode] },
              { icon: Users, label: `${course.capacity} places` },
              ...(course.room ? [{ icon: MapPin, label: course.room }] : []),
            ].map((r, i) => (
              <p key={i} className="text-[12px] text-muted flex items-center gap-2"><r.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: course.color }} /> {r.label}</p>
            ))}
          </div>

          <div className="rounded-xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${course.color}, #1E1B4B)` }}>
            <Award className="w-5 h-5 text-gold mb-1.5" />
            <p className="font-bold text-sm leading-snug mb-1">Attestation à la clé</p>
            <p className="text-white/70 text-xs leading-relaxed">Complétez les {total} séances pour recevoir votre attestation de participation JFN.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
