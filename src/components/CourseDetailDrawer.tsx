"use client";

import Link from "next/link";
import {
  X, BookOpen, FileText, Video, MonitorPlay, Radio, Bot, Check,
  Lock, Clock, Award, Target, ChevronRight, Play, User, Star,
  CalendarClock, MessageSquare, Wifi, BarChart2, GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";

interface Props {
  courseId: string | null;
  onClose: () => void;
}

export default function CourseDetailDrawer({ courseId, onClose }: Props) {
  const { db } = useDB();
  const { user } = useAuth();
  const open = !!courseId;

  const course = db?.courses.find((c) => c.id === courseId);
  const ue = db?.ues.find((u) => u.id === course?.ueId);
  const chapters = (db?.chapters.filter((c) => c.courseId === courseId) || []).sort((a, b) => a.order - b.order);
  const doneIds = new Set(db?.progress.filter((p) => p.studentId === user?.id).map((p) => p.chapterId) || []);
  const done = chapters.filter((c) => doneIds.has(c.id)).length;
  const pct = chapters.length ? Math.round((done / chapters.length) * 100) : 0;
  const lives = db?.lives.filter((l) => l.courseId === courseId) || [];
  const nextLive = lives.find((l) => l.status === "planifie" || l.status === "encours");
  const forumCount = db?.forum.filter((f) => f.ueId === course?.ueId).length || 0;
  const unlocked = (i: number) => i === 0 || doneIds.has(chapters[i - 1].id);

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

        {course && ue && (
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
                    <span className="text-[10px] font-black uppercase tracking-widest bg-gold text-white px-2 py-0.5">{ue.code}</span>
                    <span className="text-[10px] font-bold text-white/60">{ue.ects} ECTS · {ue.semestre}</span>
                    {course.profIA && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/15 px-2 py-0.5"><Bot className="w-3 h-3 text-gold" /> Prof IA</span>}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold leading-tight">{course.title}</h2>
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Pr. Amina Bello</span>
                    <span className="text-white/30">·</span>
                    {chapters.length} chapitres
                    <span className="text-white/30">·</span>
                    ~{chapters.length * 25} min
                  </p>
                </div>
                {/* Progression */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-black text-gold leading-none">{pct}%</p>
                    <p className="text-[9px] text-white/60 mt-0.5">{done}/{chapters.length} validés</p>
                  </div>
                  <button onClick={onClose}
                    className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Barre progression */}
              <div className="relative h-1 bg-white/10">
                <div className="h-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* ── Corps : 2 colonnes ── */}
            <div className="flex-1 overflow-y-auto grid lg:grid-cols-[1fr_300px] items-start">

              {/* Col gauche : description + chapitres */}
              <div className="lg:border-r border-border min-h-full">

                {/* Description */}
                <div className="px-5 sm:px-8 py-4 border-b border-border">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">À propos du cours</p>
                  <p className="text-sm text-muted leading-relaxed">{course.description}</p>
                </div>

                {/* Live à venir */}
                {nextLive && (
                  <div className={`px-5 sm:px-8 py-3 border-b border-border flex items-center gap-3 ${nextLive.status === "encours" ? "bg-red-50" : "bg-cama/5"}`}>
                    <Radio className={`w-4 h-4 flex-shrink-0 ${nextLive.status === "encours" ? "text-red-500 animate-pulse" : "text-cama"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-bold ${nextLive.status === "encours" ? "text-red-600" : "text-cama"}`}>
                        {nextLive.status === "encours" ? "EN DIRECT MAINTENANT" : "Prochain live"}
                      </p>
                      <p className="text-xs font-bold text-ink truncate">{nextLive.title}</p>
                      <p className="text-[10px] text-muted">
                        {new Date(nextLive.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · {nextLive.durationMin} min
                      </p>
                    </div>
                    {nextLive.status === "encours" && (
                      <Link href={`/live/${nextLive.id}`}
                        className="text-[10px] font-bold bg-red-500 text-white px-3 py-1.5 hover:bg-red-600 transition-colors flex-shrink-0">
                        Rejoindre
                      </Link>
                    )}
                  </div>
                )}

                {/* Chapitres */}
                <div className="px-5 sm:px-8 py-4">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3 flex items-center justify-between">
                    <span>Programme — {chapters.length} chapitres</span>
                    <span className="text-subtle normal-case font-normal">{done} validés</span>
                  </p>
                  <div className="border border-border divide-y divide-border">
                    {chapters.map((c, i) => {
                      const isDone = doneIds.has(c.id);
                      const isOpen = unlocked(i);
                      return (
                        <div key={c.id} className={`flex items-center gap-3 p-3 ${!isOpen ? "opacity-50" : ""}`}>
                          <div className={`w-7 h-7 flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                            isDone ? "bg-green-500 text-white" : isOpen ? "bg-cama text-white" : "bg-border text-subtle"
                          }`}>
                            {isDone ? <Check className="w-3.5 h-3.5" /> : isOpen ? c.order : <Lock className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink leading-snug">{c.title}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {c.natif && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><MonitorPlay className="w-2.5 h-2.5" /> Natif</span>}
                              {c.pdf && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark"><FileText className="w-2.5 h-2.5" /> PDF {c.pdf.sizeMo} Mo</span>}
                              {c.video && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><Video className="w-2.5 h-2.5" /> {c.video.durationMin} min</span>}
                              {c.liveId && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500"><Radio className="w-2.5 h-2.5" /> Live</span>}
                            </div>
                          </div>
                          <span className="text-[9px] text-subtle flex-shrink-0 flex items-center gap-1"><Clock className="w-3 h-3" /> ~25 min</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-subtle mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Chaque chapitre se débloque après validation du checkpoint précédent.
                  </p>
                </div>
              </div>

              {/* Col droite : infos + CTA */}
              <div className="divide-y divide-border">

                {/* CTA principal */}
                <div className="px-4 py-4">
                  <Link href={`/cours/${course.id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-cama text-white text-sm font-bold hover:bg-cama-700 transition-colors">
                    <Play className="w-4 h-4 fill-white" />
                    {done > 0 ? "Continuer le cours" : "Commencer le cours"}
                  </Link>
                  {done > 0 && done < chapters.length && (
                    <p className="text-[10px] text-subtle text-center mt-2">
                      Reprendre au chapitre {done + 1} : {chapters[done]?.title}
                    </p>
                  )}
                </div>

                {/* Fiche infos */}
                <div className="px-4 py-3">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Fiche du cours</p>
                  <div className="space-y-2">
                    {[
                      { icon: GraduationCap, k: "UE", v: `${ue.code} — ${ue.title}` },
                      { icon: Award,    k: "Crédits", v: `${ue.ects} ECTS` },
                      { icon: CalendarClock, k: "Semestre", v: ue.semestre },
                      { icon: BarChart2, k: "Difficulté", v: "Intermédiaire" },
                      { icon: Clock,    k: "Charge estimée", v: `${chapters.length * 25} min + TD` },
                      { icon: Star,     k: "Évaluation", v: "4.7/5 (142 étudiants)" },
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

                {/* Modes disponibles */}
                <div className="px-4 py-3">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Modes d&apos;apprentissage</p>
                  <div className="space-y-1.5">
                    {[
                      { icon: MonitorPlay, label: "Cours natif", sub: "~0,05 Mo · idéal bas débit", on: chapters.some((c) => c.natif) },
                      { icon: FileText, label: "Support PDF", sub: "Téléchargeable hors-ligne", on: chapters.some((c) => c.pdf) },
                      { icon: Video, label: "Vidéo + audio seul", sub: "240p à 720p + transcription", on: chapters.some((c) => c.video) },
                      { icon: Radio, label: "Lives + replays", sub: "Classes virtuelles synchrones", on: lives.length > 0 },
                      { icon: Bot, label: "Prof IA", sub: "Tuteur ancré sur les ressources", on: course.profIA },
                    ].map((m) => (
                      <div key={m.label} className={`flex items-center gap-2.5 ${!m.on ? "opacity-40" : ""}`}>
                        <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${m.on ? "bg-cama-50" : "bg-surface"}`}>
                          <m.icon className={`w-3.5 h-3.5 ${m.on ? "text-cama" : "text-subtle"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-ink">{m.label}</p>
                          <p className="text-[9px] text-muted">{m.sub}</p>
                        </div>
                        {m.on && <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Objectifs */}
                <div className="px-4 py-3">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3 text-cama" /> À la fin de ce cours
                  </p>
                  <div className="space-y-1.5">
                    {[
                      "Maîtriser les concepts fondamentaux de l'UE",
                      "Réussir le checkpoint de chaque chapitre",
                      "Être prêt pour l'examen Safe-CAMA",
                    ].map((o, i) => (
                      <p key={i} className="flex items-start gap-2 text-[11px] text-muted">
                        <ChevronRight className="w-3 h-3 text-cama flex-shrink-0 mt-0.5" /> {o}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Communauté */}
                <div className="px-4 py-3">
                  <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Communauté</p>
                  <div className="flex items-center gap-2.5 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-cama flex-shrink-0" />
                    <p className="text-xs text-ink"><strong>{forumCount}</strong> messages dans le forum UE</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Wifi className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <p className="text-xs text-ink">Pr. Bello <span className="text-green-600 font-bold">en ligne</span> — chat intégré au cours</p>
                  </div>
                </div>

                {/* Footer note */}
                <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #1E1B4B, #312E81)" }}>
                  <p className="text-[10px] text-white/80 leading-relaxed">
                    <BookOpen className="w-3 h-3 inline mr-1 text-gold" />
                    Tous les contenus sont optimisés <span className="font-bold text-gold">data budgeting</span> :
                    chaque mode affiche son poids en Mo avant ouverture.
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
