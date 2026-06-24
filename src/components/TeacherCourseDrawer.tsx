"use client";

import Link from "next/link";
import {
  X, BookOpen, FileText, Video, MonitorPlay, Radio, Bot,
  Clock, Award, ChevronRight, Edit3, Eye, EyeOff, Users, BarChart2,
  GraduationCap, CalendarClock, TrendingUp, AlertTriangle, ShieldCheck,
  MessageSquare, Plus, Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DBProgramCourse, DBChapter, DBExam } from "@/lib/supabase";
import { fetchChapters } from "@/lib/program";
import { fetchExamsForCourses } from "@/lib/exams";
import { fetchLivesForCourses, type DBLive } from "@/lib/lives";

interface Props {
  courseId: string | null;
  onClose: () => void;
}

/* Cohorte représentative dérivée de l'id (stable, sans backend) */
function cohortOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return 32 + (h % 26); // 32 → 57 étudiants
}

export default function TeacherCourseDrawer({ courseId, onClose }: Props) {
  const open = !!courseId;

  const [course, setCourse] = useState<DBProgramCourse | null>(null);
  const [chapters, setChapters] = useState<DBChapter[]>([]);
  const [exams, setExams] = useState<DBExam[]>([]);
  const [lives, setLives] = useState<DBLive[]>([]);

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    (async () => {
      const [{ data: c }, chs, exs, lvs] = await Promise.all([
        supabase.from("program_courses").select("*").eq("id", courseId).maybeSingle(),
        fetchChapters(courseId),
        fetchExamsForCourses([courseId]),
        fetchLivesForCourses([courseId]),
      ]);
      if (!active) return;
      setCourse((c as DBProgramCourse) ?? null);
      setChapters(chs);
      setExams(exs);
      setLives(lvs);
    })();
    return () => { active = false; };
  }, [courseId]);

  const liveActive = lives.find((l) => l.status === "encours");
  const liveNext = lives.find((l) => l.status === "planifie");
  const liveShortcut = liveActive ?? liveNext ?? null;
  const forumCount = 0;

  const students = course ? cohortOf(course.id) : 0;
  const completion = 38 + (students % 40);            // taux moyen de complétion %
  const atRisk = Math.max(1, Math.round(students * 0.12));
  const active7d = Math.round(students * 0.74);

  const modeCount = {
    natif: chapters.filter((c) => c.natif).length,
    pdf:   chapters.filter((c) => c.pdf).length,
    video: chapters.filter((c) => c.video).length,
    live:  lives.length,
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[150] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer — sort de la GAUCHE */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-[160] w-full lg:w-[78%] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}>

        {course && (
          <>
            {/* ── Header hero ── */}
            <div className="relative overflow-hidden text-white flex-shrink-0"
              style={{ background: "linear-gradient(120deg, #1E1B4B 0%, #312E81 55%, #4F46E5 100%)" }}>
              <div className="absolute inset-0 opacity-[0.07]" style={{
                backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 22px, #fff 22px, #fff 23px), repeating-linear-gradient(0deg, transparent, transparent 22px, #fff 22px, #fff 23px)",
              }} />
              <div className="relative px-5 sm:px-8 py-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-gold text-white px-2 py-0.5">{course.code}</span>
                    <span className="text-[10px] font-bold text-white/60">{course.ects} ECTS · {course.semestre}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 ${course.published ? "bg-green-500/90" : "bg-white/15"}`}>
                      {course.published ? <><Eye className="w-3 h-3" /> Publié</> : <><EyeOff className="w-3 h-3" /> Brouillon</>}
                    </span>
                    {course.prof_ia && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/15 px-2 py-0.5"><Bot className="w-3 h-3 text-gold" /> Prof IA</span>}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold leading-tight">{course.title}</h2>
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {course.title}</span>
                    <span className="text-white/30">·</span>
                    {chapters.length} chapitres
                    <span className="text-white/30">·</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {students} étudiants</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-black text-gold leading-none">{completion}%</p>
                    <p className="text-[9px] text-white/60 mt-0.5">complétion moy.</p>
                  </div>
                  <button onClick={onClose}
                    className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="relative h-1 bg-white/10">
                <div className="h-full bg-gold transition-all duration-700" style={{ width: `${completion}%` }} />
              </div>
            </div>

            {/* ── Corps : 2 colonnes ── */}
            <div className="flex-1 overflow-y-auto grid lg:grid-cols-[1fr_300px] items-start">

              {/* Col gauche : description + chapitres + lives + examens */}
              <div className="lg:border-r border-border min-h-full">

                {/* Description */}
                <div className="px-5 sm:px-8 py-4 border-b border-border">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Présentation du cours</p>
                  <p className="text-sm text-muted leading-relaxed">{(course.description ?? "") || "Aucune description renseignée."}</p>
                </div>

                {/* Engagement cohorte */}
                <div className="px-5 sm:px-8 py-4 border-b border-border">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3">Engagement de la cohorte</p>
                  <div className="grid grid-cols-3 border border-border divide-x divide-border">
                    {[
                      { icon: Users, v: String(active7d), l: "actifs · 7 j", c: "text-cama" },
                      { icon: TrendingUp, v: `${completion}%`, l: "complétion", c: "text-green-600" },
                      { icon: AlertTriangle, v: String(atRisk), l: "à risque", c: "text-red-500" },
                    ].map((s) => (
                      <div key={s.l} className="p-3 flex items-center gap-2.5">
                        <s.icon className={`w-4 h-4 flex-shrink-0 ${s.c}`} />
                        <div>
                          <p className={`text-base font-bold leading-none ${s.c}`}>{s.v}</p>
                          <p className="text-[10px] text-muted leading-tight mt-0.5">{s.l}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chapitres */}
                <div className="px-5 sm:px-8 py-4">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3 flex items-center justify-between">
                    <span>Programme — {chapters.length} chapitres</span>
                    <Link href={`/enseignant/cours/${course.id}`} className="text-cama normal-case font-bold flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Éditer
                    </Link>
                  </p>
                  {chapters.length === 0 ? (
                    <div className="border-2 border-dashed border-border p-6 text-center">
                      <p className="text-sm text-muted">Aucun chapitre. Ouvrez l&apos;éditeur pour composer le cours.</p>
                    </div>
                  ) : (
                    <div className="border border-border divide-y divide-border">
                      {chapters.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 p-3">
                          <div className="w-7 h-7 flex items-center justify-center text-[11px] font-bold flex-shrink-0 bg-cama text-white">
                            {c.ordre}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink leading-snug">{c.title}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {c.natif && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><MonitorPlay className="w-2.5 h-2.5" /> Natif</span>}
                              {c.pdf && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark"><FileText className="w-2.5 h-2.5" /> PDF {c.pdf.sizeMo} Mo</span>}
                              {c.video && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><Video className="w-2.5 h-2.5" /> {c.video.durationMin} min</span>}
                              {c.live_id && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500"><Radio className="w-2.5 h-2.5" /> Live</span>}
                              {!c.natif && !c.pdf && !c.video && !c.live_id && <span className="text-[9px] text-subtle italic">Aucun mode — chapitre vide</span>}
                            </div>
                          </div>
                          <span className="text-[9px] text-subtle flex-shrink-0 flex items-center gap-1"><Clock className="w-3 h-3" /> ~25 min</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lives */}
                {lives.length > 0 && (
                  <div className="px-5 sm:px-8 py-4 border-t border-border">
                    <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3">Classes virtuelles</p>
                    <div className="space-y-2">
                      {lives.map((l) => (
                        <div key={l.id} className={`flex items-center gap-3 p-3 border ${l.status === "encours" ? "bg-red-50 border-red-100" : "bg-surface border-border"}`}>
                          <Radio className={`w-4 h-4 flex-shrink-0 ${l.status === "encours" ? "text-red-500 animate-pulse" : "text-cama"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-ink truncate">{l.title}</p>
                            <p className="text-[10px] text-muted">
                              {l.status === "encours" ? "En direct maintenant" : l.status === "planifie" ? "Planifiée" : "Terminée"}
                            </p>
                          </div>
                          {l.status !== "termine" && (
                            <Link href={`/live/${l.id}`} className={`text-[10px] font-bold px-3 py-1.5 transition-colors flex-shrink-0 ${l.status === "encours" ? "bg-red-500 text-white hover:bg-red-600" : "bg-cama text-white hover:bg-cama-700"}`}>
                              {l.status === "encours" ? "Entrer" : "Démarrer"}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examens liés */}
                {exams.length > 0 && (
                  <div className="px-5 sm:px-8 py-4 border-t border-border">
                    <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3">Évaluations rattachées à l&apos;UE</p>
                    <div className="space-y-2">
                      {exams.map((e) => {
                        return (
                          <div key={e.id} className="flex items-center gap-3 p-3 border border-border bg-surface">
                            <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${e.status === "ouvert" ? "text-cama" : "text-subtle"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-ink truncate">{e.title}</p>
                              <p className="text-[10px] text-muted">{e.duration_min} min</p>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 ${e.status === "ouvert" ? "bg-green-50 text-green-600" : "bg-white text-muted border border-border"}`}>
                              {e.status === "ouvert" ? "Ouvert" : e.status === "planifie" ? "Planifié" : "Terminé"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Col droite : actions + infos */}
              <div className="divide-y divide-border">

                {/* Actions principales */}
                <div className="px-4 py-4 space-y-2">
                  {/* Raccourci live (entrer / démarrer la classe virtuelle) */}
                  {liveShortcut && (
                    <Link href={`/live/${liveShortcut.id}`}
                      className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white transition-colors ${
                        liveActive ? "bg-red-500 hover:bg-red-600" : "bg-ink hover:bg-charcoal"}`}>
                      <Radio className={`w-4 h-4 ${liveActive ? "animate-pulse" : ""}`} />
                      {liveActive ? "Rejoindre le live en cours" : "Démarrer la classe virtuelle"}
                    </Link>
                  )}
                  <Link href={`/enseignant/cours/${course.id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-cama text-white text-sm font-bold hover:bg-cama-700 transition-colors">
                    <Edit3 className="w-4 h-4" /> Gérer &amp; diffuser
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        const next = !course.published;
                        setCourse({ ...course, published: next });
                        await supabase.from("program_courses").update({ published: next }).eq("id", course.id);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-2 transition-all ${
                        course.published ? "border-green-500 bg-green-50 text-green-600" : "border-border text-muted hover:border-cama/40"}`}>
                      {course.published ? <><Eye className="w-3.5 h-3.5" /> Publié</> : <><EyeOff className="w-3.5 h-3.5" /> Publier</>}
                    </button>
                    <button
                      onClick={async () => {
                        const next = !course.prof_ia;
                        setCourse({ ...course, prof_ia: next });
                        await supabase.from("program_courses").update({ prof_ia: next }).eq("id", course.id);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-2 transition-all ${
                        course.prof_ia ? "border-cama bg-cama-50 text-cama" : "border-border text-muted hover:border-cama/40"}`}>
                      <Bot className="w-3.5 h-3.5" /> Prof IA
                    </button>
                  </div>
                </div>

                {/* Fiche infos */}
                <div className="px-4 py-3">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Fiche du cours</p>
                  <div className="space-y-2">
                    {[
                      { icon: GraduationCap, k: "UE", v: `${course.code} — ${course.title}` },
                      { icon: Award, k: "Crédits", v: `${course.ects} ECTS` },
                      { icon: CalendarClock, k: "Semestre", v: course.semestre },
                      { icon: Users, k: "Cohorte inscrite", v: `${students} étudiants` },
                      { icon: BarChart2, k: "Complétion moyenne", v: `${completion}%` },
                      { icon: Clock, k: "Charge estimée", v: `${chapters.length * 25} min + TD` },
                    ].map((r) => (
                      <div key={r.k} className="flex items-start gap-2.5">
                        <r.icon className="w-3.5 h-3.5 text-cama flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[9px] text-subtle uppercase tracking-wider">{r.k}</p>
                          <p className="text-xs font-semibold text-ink leading-snug">{r.v}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Couverture des modes */}
                <div className="px-4 py-3">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Couverture des modes</p>
                  <div className="space-y-1.5">
                    {[
                      { icon: MonitorPlay, label: "Cours natif", n: modeCount.natif },
                      { icon: FileText, label: "Support PDF", n: modeCount.pdf },
                      { icon: Video, label: "Vidéo", n: modeCount.video },
                      { icon: Radio, label: "Lives", n: modeCount.live },
                    ].map((m) => {
                      const ratio = chapters.length ? Math.round((m.n / chapters.length) * 100) : 0;
                      return (
                        <div key={m.label} className="flex items-center gap-2.5">
                          <m.icon className={`w-3.5 h-3.5 flex-shrink-0 ${m.n ? "text-cama" : "text-subtle"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-[11px] font-semibold text-ink">{m.label}</p>
                              <p className="text-[10px] text-muted">{m.n}/{chapters.length}</p>
                            </div>
                            <div className="h-1 bg-surface overflow-hidden">
                              <div className="h-full bg-cama" style={{ width: `${ratio}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Suggestions IA */}
                <div className="px-4 py-3">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cama" /> Suggestions pédagogiques
                  </p>
                  <div className="space-y-1.5">
                    {[
                      modeCount.natif < chapters.length ? "Ajouter un cours natif aux chapitres sans mode léger (bas débit)." : "Tous les chapitres ont un mode natif — excellent pour le bas débit.",
                      atRisk > 3 ? `${atRisk} étudiants à risque : planifier un live de remédiation.` : "Engagement sain : peu d'étudiants à risque.",
                      !course.prof_ia ? "Activer le Prof IA pour un tutorat ancré sur vos ressources." : "Prof IA actif — pensez à enrichir les transcriptions.",
                    ].map((o, i) => (
                      <p key={i} className="flex items-start gap-2 text-[11px] text-muted">
                        <ChevronRight className="w-3 h-3 text-cama flex-shrink-0 mt-0.5" /> {o}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Communauté */}
                <div className="px-4 py-3">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Forum de l&apos;UE</p>
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-3.5 h-3.5 text-cama flex-shrink-0" />
                    <p className="text-xs text-ink"><strong>{forumCount}</strong> message(s) — pensez à répondre aux questions en attente.</p>
                  </div>
                </div>

                {/* Footer note */}
                <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #1E1B4B, #312E81)" }}>
                  <p className="text-[10px] text-white/80 leading-relaxed">
                    <BookOpen className="w-3 h-3 inline mr-1 text-gold" />
                    Diffusion <span className="font-bold text-gold">multi-modes</span> : chaque ressource est compressée et son poids affiché avant ouverture côté étudiant.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
