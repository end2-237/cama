"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, FileText, Video, MonitorPlay, Radio, Bot,
  Trash2, Upload, Check, X, GripVertical, Eye, EyeOff,
  Sparkles, Calendar, Type, List as ListIcon, HelpCircle,
  Target, CalendarClock, Clock, Send, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BlocNatif } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { DBProgramCourse, DBChapter, DBSession, CycleMode, SessionKind } from "@/lib/supabase";
import {
  fetchChapters, addChapter as addChapterDB, updateChapter, deleteChapter,
  updateCourseContent, fetchSessions, upsertSession, deleteSession,
} from "@/lib/program";
import { DAYS, CYCLE_MODES, SESSION_KINDS } from "@/lib/scheduling";
import { createLive, deleteLive } from "@/lib/lives";
import { uploadMedia, estimateVideoSizeMo, fetchResources, addResource, deleteResource } from "@/lib/resources";
import type { DBCourseResource, ResourceKind } from "@/lib/supabase";

export default function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [course, setCourse] = useState<DBProgramCourse | null>(null);
  const [chapters, setChapters] = useState<DBChapter[]>([]);
  const [newChap, setNewChap] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "enseignant")) router.replace("/auth/login");
  }, [loading, user, router]);

  const reload = useCallback(async () => {
    const { data } = await supabase.from("program_courses").select("*").eq("id", id).maybeSingle();
    setCourse((data as DBProgramCourse) ?? null);
    const chs = await fetchChapters(id);
    setChapters(chs.sort((a, b) => a.ordre - b.ordre));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  if (loading || !user || !course) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>;
  }

  const addChap = async () => {
    if (!newChap.trim()) return;
    await addChapterDB(id, newChap.trim(), chapters.length + 1);
    setNewChap("");
    reload();
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-16">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-subtle">{course.code} · Éditeur de cours</p>
            <p className="text-sm font-bold text-ink truncate">{course.title}</p>
          </div>
          {/* Prof IA toggle */}
          <button
            onClick={async () => { await updateCourseContent(id, { prof_ia: !course.prof_ia }); reload(); }}
            className={`hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full border-2 transition-all ${
              course.prof_ia ? "border-cama bg-cama-50 text-cama" : "border-border text-muted"}`}>
            <Bot className="w-4 h-4" /> Prof IA {course.prof_ia ? "activé" : "désactivé"}
          </button>
          {/* Publication */}
          <button
            onClick={async () => { await updateCourseContent(id, { published: !course.published }); reload(); }}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all ${
              course.published ? "bg-green-500 text-white" : "bg-border text-muted hover:bg-cama hover:text-white"}`}>
            {course.published ? <><Eye className="w-4 h-4" /> Publié</> : <><EyeOff className="w-4 h-4" /> Brouillon</>}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-sm text-muted mb-6">
          Composez librement chaque chapitre : un même chapitre peut proposer un PDF, une vidéo, un cours natif et un live.
        </p>

        <div className="space-y-4">
          {chapters.map((ch) => (
            <div key={ch.id} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <GripVertical className="w-4 h-4 text-subtle flex-shrink-0" />
                <div className="w-7 h-7 rounded-full bg-cama text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{ch.ordre}</div>
                <p className="font-bold text-ink flex-1 min-w-0 truncate">{ch.title}</p>
                <div className="flex items-center gap-1.5">
                  {ch.pdf && <span className="badge bg-gold/10 text-gold-dark text-[10px]"><FileText className="w-3 h-3" /> PDF</span>}
                  {ch.video && <span className="badge bg-cama-50 text-cama text-[10px]"><Video className="w-3 h-3" /> Vidéo</span>}
                  {ch.natif && <span className="badge bg-cama-50 text-cama text-[10px]"><MonitorPlay className="w-3 h-3" /> Natif</span>}
                  {ch.live_id && <span className="badge bg-red-50 text-red-500 text-[10px]"><Radio className="w-3 h-3" /> Live</span>}
                </div>
                <button onClick={() => setEditing(editing === ch.id ? null : ch.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${
                    editing === ch.id ? "border-cama bg-cama text-white" : "border-border text-muted hover:border-cama/40"}`}>
                  {editing === ch.id ? "Fermer" : "Gérer les modes"}
                </button>
                <button onClick={async () => { await deleteChapter(ch.id); reload(); }}
                  className="p-1.5 text-subtle hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {editing === ch.id && <ChapterModes chapter={ch} reload={reload} />}
            </div>
          ))}
        </div>

        {/* Ajouter chapitre */}
        <div className="mt-6 bg-white rounded-2xl border-2 border-dashed border-border p-5 flex gap-3">
          <input value={newChap} onChange={(e) => setNewChap(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addChap()}
            placeholder="Titre du nouveau chapitre…"
            className="flex-1 text-sm outline-none text-ink placeholder-subtle min-w-0" />
          <button onClick={addChap} className="btn-primary gap-2 py-2 px-5 text-sm">
            <Plus className="w-4 h-4" /> Ajouter le chapitre
          </button>
        </div>

        {/* ── Fiche pédagogique (s'affiche dans le drawer étudiant) ── */}
        <div className="mt-10 flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-cama" strokeWidth={1.5} />
          <div>
            <h2 className="text-xl font-bold text-ink">Fiche pédagogique</h2>
            <p className="text-xs text-muted">Ces informations s&apos;affichent dans la fiche détaillée côté étudiant.</p>
          </div>
        </div>
        <CourseDetailsEditor course={course} reload={reload} />

        {/* ── Ressources du cours ── */}
        <div className="mt-10 flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-cama" strokeWidth={1.5} />
          <div>
            <h2 className="text-xl font-bold text-ink">Ressources du cours</h2>
            <p className="text-xs text-muted">Syllabus, supports et bibliographie — visibles dans la barre latérale côté étudiant.</p>
          </div>
        </div>
        <ResourcesEditor courseId={id} />

        {/* ── Planification proposée ── */}
        <div className="mt-10 flex items-center gap-3 mb-4">
          <CalendarClock className="w-6 h-6 text-cama" strokeWidth={1.5} />
          <div>
            <h2 className="text-xl font-bold text-ink">Planification proposée</h2>
            <p className="text-xs text-muted">Proposez vos séances : l&apos;administration les valide et les planifie pour les étudiants.</p>
          </div>
        </div>
        <SessionPlanner courseId={id} teacherId={user.id} courseTitle={course.title} />
      </main>
    </div>
  );
}

/* ════ Gestion des modes d'un chapitre ════ */
function ChapterModes({ chapter, reload }: { chapter: DBChapter; reload: () => void }) {
  const ch = chapter;
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDur, setVideoDur] = useState("20");
  const [transcribing, setTranscribing] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [liveDate, setLiveDate]   = useState("");
  const [pdfUploading, setPdfUploading] = useState(0);   // 0 = idle, sinon %
  const [videoUploading, setVideoUploading] = useState(0);
  const [uploadErr, setUploadErr] = useState("");

  return (
    <div className="border-t border-border bg-surface p-5 grid md:grid-cols-2 gap-4 animate-fade-up">

      {/* ── Mode 1 : PDF ── */}
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs font-bold text-ink flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-gold-dark" /> Mode 1 — Support PDF</p>
        {ch.pdf ? (
          <div className="flex items-center justify-between bg-gold/5 border border-gold/20 rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink truncate">{ch.pdf.name}</p>
              <p className="text-[10px] text-muted">{ch.pdf.sizeMo} Mo · {ch.pdf.pages} pages · compressé + vignette générée</p>
            </div>
            <button onClick={async () => { await updateChapter(ch.id, { pdf: null }); reload(); }}
              className="text-subtle hover:text-red-500"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploadErr(""); setPdfUploading(5);
                const res = await uploadMedia(ch.program_course_id, f, setPdfUploading);
                if ("error" in res) { setUploadErr(res.error); setPdfUploading(0); return; }
                await updateChapter(ch.id, { pdf: { name: f.name, sizeMo: res.sizeMo, pages: 0, url: res.url } });
                setPdfUploading(0);
                reload();
              }} />
            {pdfUploading > 0 ? (
              <div className="border-2 border-dashed border-cama/40 rounded-lg py-4 px-3">
                <p className="text-[11px] text-cama font-bold flex items-center gap-2 mb-2"><Upload className="w-4 h-4 animate-pulse" /> Téléversement… {pdfUploading}%</p>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-cama transition-all" style={{ width: `${pdfUploading}%` }} /></div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg py-4 text-xs text-muted hover:border-cama/40 hover:text-cama transition-all flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> Déposer un PDF (stocké, compressé pour bas-débit)
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Mode 2 : Vidéo ── */}
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs font-bold text-ink flex items-center gap-2 mb-3"><Video className="w-4 h-4 text-cama" /> Mode 2 — Vidéo</p>
        {ch.video ? (
          <div className="flex items-center justify-between bg-cama-50 border border-cama/15 rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink truncate">{ch.video.title}</p>
              <p className="text-[10px] text-muted">{ch.video.durationMin} min · transcodé 240p→720p · {ch.video.transcript?.startsWith("Transcription en cours") ? "⏳ transcription en cours…" : "✅ transcription IA générée"}</p>
            </div>
            <button onClick={async () => { await updateChapter(ch.id, { video: null }); reload(); }}
              className="text-subtle hover:text-red-500"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="space-y-2">
            <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Titre de la vidéo"
              className="w-full text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
            <div className="flex gap-2 items-center">
              <input value={videoDur} onChange={(e) => setVideoDur(e.target.value)} type="number" min="1" placeholder="Durée (min)"
                className="w-24 text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
              <span className="text-[10px] text-subtle">≈ {estimateVideoSizeMo(parseInt(videoDur) || 20, "360p")} Mo en 360p (bas-débit)</span>
            </div>
            <input ref={videoFileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f || !videoTitle.trim()) { if (!videoTitle.trim()) setUploadErr("Donnez d'abord un titre à la vidéo."); return; }
                setUploadErr(""); setVideoUploading(5);
                const res = await uploadMedia(ch.program_course_id, f, setVideoUploading);
                if ("error" in res) { setUploadErr(res.error); setVideoUploading(0); return; }
                const dur = parseInt(videoDur) || 20;
                const placeholder = `Transcription en cours de génération pour « ${videoTitle.trim()} »…`;
                await updateChapter(ch.id, { video: { title: videoTitle.trim(), durationMin: dur, sizeMo: res.sizeMo, url: res.url, quality: "source", transcript: placeholder } });
                setVideoTitle(""); setVideoUploading(0);
                reload();

                // Lance la transcription IA (Groq Whisper) en arrière-plan.
                setTranscribing(true);
                try {
                  const tForm = new FormData();
                  tForm.append("file", f);
                  const tRes = await fetch("/api/ai/transcribe", { method: "POST", body: tForm });
                  if (tRes.ok) {
                    const { transcript } = await tRes.json();
                    if (transcript) {
                      await updateChapter(ch.id, { video: { title: videoTitle.trim() || ch.title, durationMin: dur, sizeMo: res.sizeMo, url: res.url, quality: "source", transcript } });
                      reload();
                    }
                  }
                } catch { /* transcription échoue silencieusement — le placeholder reste */ }
                setTranscribing(false);
              }} />
            {videoUploading > 0 ? (
              <div className="border border-cama/30 rounded-lg py-3 px-3">
                <p className="text-[11px] text-cama font-bold flex items-center gap-2 mb-2"><Upload className="w-4 h-4 animate-pulse" /> Téléversement… {videoUploading}%</p>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-cama transition-all" style={{ width: `${videoUploading}%` }} /></div>
              </div>
            ) : (
              <button onClick={() => videoFileRef.current?.click()}
                className="w-full btn-primary py-2 text-xs justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Déposer la vidéo (stockée + transcription IA)
              </button>
            )}
          </div>
        )}
        {transcribing && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-cama font-bold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Transcription IA (Whisper) en cours… La vidéo est déjà enregistrée.
          </div>
        )}
        {uploadErr && <p className="text-[10px] text-red-500 mt-2">{uploadErr}</p>}
      </div>

      {/* ── Mode 3 : Cours natif ── */}
      <div className="bg-white rounded-xl border border-border p-4 md:col-span-2">
        <p className="text-xs font-bold text-ink flex items-center gap-2 mb-3"><MonitorPlay className="w-4 h-4 text-cama" /> Mode 3 — Cours interactif natif (éditeur intégré)</p>
        <NatifEditor chapter={ch} reload={reload} />
      </div>

      {/* ── Mode 4 : Live ── */}
      <div className="bg-white rounded-xl border border-border p-4 md:col-span-2">
        <p className="text-xs font-bold text-ink flex items-center gap-2 mb-3"><Radio className="w-4 h-4 text-red-500" /> Mode 4 — Classe virtuelle en direct</p>
        {ch.live_id ? (
          <LiveStatus chapter={ch} reload={reload} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <input value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} placeholder="Titre de la séance"
              className="flex-1 min-w-[180px] text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
            <input value={liveDate} onChange={(e) => setLiveDate(e.target.value)} type="datetime-local"
              className="text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
            <button
              onClick={async () => {
                if (!liveTitle.trim()) return;
                const liveId = await createLive({
                  program_course_id: ch.program_course_id,
                  chapter_id: ch.id,
                  title: liveTitle.trim() || "Classe virtuelle",
                  created_by: user?.id ?? null,
                });
                if (liveId) { await updateChapter(ch.id, { live_id: liveId }); }
                setLiveTitle("");
                reload();
              }}
              className="btn-primary py-2 px-4 text-xs gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Planifier
            </button>
            <p className="w-full text-[10px] text-subtle">Enregistrement automatique → replay publié comme vidéo. Audio prioritaire pour le bas-débit.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveStatus({ chapter, reload }: { chapter: DBChapter; reload: () => void }) {
  if (!chapter.live_id) return null;
  return (
    <div className="flex items-center justify-between bg-red-50/60 border border-red-100 rounded-lg px-3 py-2.5 flex-wrap gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">Classe virtuelle programmée</p>
        <p className="text-[10px] text-muted">Salle de classe virtuelle prête</p>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/live/${chapter.live_id}`} className="text-xs font-bold bg-cama text-white px-3 py-1.5 rounded-full hover:bg-cama-700 transition-colors">
          Entrer dans la salle
        </Link>
        <button onClick={async () => { await deleteLive(chapter.live_id!); await updateChapter(chapter.id, { live_id: null }); reload(); }}
          className="text-subtle hover:text-red-500"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* ════ Éditeur de cours natif (blocs) ════ */
function NatifEditor({ chapter, reload }: { chapter: DBChapter; reload: () => void }) {
  const blocks = (chapter.natif?.blocks as BlocNatif[]) ?? [];
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"titre" | "texte" | "point" | "quiz">("texte");
  const [qOpts, setQOpts] = useState(["", "", ""]);
  const [qGood, setQGood] = useState(0);

  const addBlock = async () => {
    if (!text.trim()) return;
    let b: BlocNatif;
    if (kind === "quiz") {
      const opts = qOpts.filter((o) => o.trim());
      if (opts.length < 2) return;
      b = { type: "quiz", question: text.trim(), options: opts, bonne: Math.min(qGood, opts.length - 1) };
    } else {
      b = { type: kind, text: text.trim() } as BlocNatif;
    }
    const newBlocks = [...blocks, b];
    await updateChapter(chapter.id, { natif: { blocks: newBlocks } });
    setText(""); setQOpts(["", "", ""]);
    reload();
  };

  const deleteBlock = async (i: number) => {
    const newBlocks = blocks.filter((_, j) => j !== i);
    await updateChapter(chapter.id, { natif: { blocks: newBlocks } });
    reload();
  };

  return (
    <div>
      {blocks.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {blocks.map((b, i) => (
            <div key={i} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
              <span className="text-[9px] font-bold uppercase text-cama bg-cama-50 px-1.5 py-0.5 rounded flex-shrink-0">
                {b.type}
              </span>
              <p className="text-xs text-muted truncate flex-1">{"text" in b ? b.text : b.type === "quiz" ? b.question : ""}</p>
              <button onClick={() => deleteBlock(i)}
                className="text-subtle hover:text-red-500 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 mb-2 flex-wrap">
        {([["titre", "Titre", Type], ["texte", "Texte", ListIcon], ["point", "Point-clé", Sparkles], ["quiz", "Quiz", HelpCircle]] as const).map(([k, lbl, Icon]) => (
          <button key={k} onClick={() => setKind(k)}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full border transition-all ${
              kind === k ? "border-cama bg-cama text-white" : "border-border text-muted hover:border-cama/40"}`}>
            <Icon className="w-3 h-3" /> {lbl}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && kind !== "quiz" && addBlock()}
          placeholder={kind === "quiz" ? "Question du quiz…" : `Contenu du bloc ${kind}…`}
          className="flex-1 text-xs border border-border rounded-lg px-3 py-2.5 outline-none focus:border-cama min-w-0" />
        <button onClick={addBlock} className="btn-primary py-2 px-4 text-xs gap-1"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
      </div>
      {kind === "quiz" && (
        <div className="mt-2 space-y-1.5 animate-fade-up">
          {qOpts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => setQGood(i)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${qGood === i ? "border-green-500 bg-green-500" : "border-border"}`}>
                {qGood === i && <Check className="w-3 h-3 text-white" />}
              </button>
              <input value={o} onChange={(e) => setQOpts(qOpts.map((x, j) => j === i ? e.target.value : x))}
                placeholder={`Option ${String.fromCharCode(65 + i)}${qGood === i ? " (bonne réponse)" : ""}`}
                className="flex-1 text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-subtle mt-2">100% texte/HTML léger — le mode de référence en zone à débit critique.</p>
    </div>
  );
}

/* ════ Éditeur de fiche pédagogique ════ */
function CourseDetailsEditor({ course, reload }: { course: DBProgramCourse; reload: () => void }) {
  const [objectives, setObjectives] = useState((course.objectives || []).join("\n"));
  const [competences, setCompetences] = useState((course.competences || []).join(", "));
  const [prerequis, setPrerequis] = useState(course.prerequis || "");
  const [audience, setAudience] = useState(course.audience || "");
  const [evaluation, setEvaluation] = useState(course.evaluation || "");
  const [volume, setVolume] = useState("");
  const [difficulte, setDifficulte] = useState(course.difficulte || "Intermédiaire");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await updateCourseContent(course.id, {
      objectives: objectives.split("\n").map((s) => s.trim()).filter(Boolean),
      competences: competences.split(",").map((s) => s.trim()).filter(Boolean),
      prerequis: prerequis.trim() || null,
      audience: audience.trim() || null,
      evaluation: evaluation.trim() || null,
      difficulte,
    });
    reload();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const field = "w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-cama";

  return (
    <div className="bg-white rounded-2xl border border-border p-5 grid md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-ink mb-1.5 block">Objectifs pédagogiques <span className="text-subtle font-normal">(un par ligne)</span></label>
        <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={4}
          placeholder={"Maîtriser…\nImplémenter…\nChoisir…"} className={field} />
      </div>
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-ink mb-1.5 block">Compétences visées <span className="text-subtle font-normal">(séparées par des virgules)</span></label>
        <input value={competences} onChange={(e) => setCompetences(e.target.value)} placeholder="Algorithmique, Analyse de complexité…" className={field} />
      </div>
      <div>
        <label className="text-xs font-bold text-ink mb-1.5 block">Prérequis</label>
        <input value={prerequis} onChange={(e) => setPrerequis(e.target.value)} placeholder="INF101 — Programmation impérative" className={field} />
      </div>
      <div>
        <label className="text-xs font-bold text-ink mb-1.5 block">Public visé</label>
        <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Étudiants L2 Informatique" className={field} />
      </div>
      <div>
        <label className="text-xs font-bold text-ink mb-1.5 block">Modalités d&apos;évaluation</label>
        <input value={evaluation} onChange={(e) => setEvaluation(e.target.value)} placeholder="CC 40% + examen 60%" className={field} />
      </div>
      <div>
        <label className="text-xs font-bold text-ink mb-1.5 block">Volume horaire</label>
        <input value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="45h CM + 20h TD" className={field} />
      </div>
      <div>
        <label className="text-xs font-bold text-ink mb-1.5 block">Difficulté</label>
        <select value={difficulte} onChange={(e) => setDifficulte(e.target.value)} className={`${field} bg-white`}>
          <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
        </select>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button onClick={save} className="btn-primary py-2.5 px-6 text-sm gap-2">
          <Check className="w-4 h-4" /> Enregistrer la fiche
        </button>
        {saved && <span className="text-xs font-bold text-green-600 flex items-center gap-1 animate-fade-in"><Check className="w-3.5 h-3.5" /> Fiche enregistrée — visible côté étudiant</span>}
      </div>
    </div>
  );
}

/* ════ Gestion des ressources du cours ════ */
const RES_KINDS: { id: ResourceKind; label: string }[] = [
  { id: "syllabus", label: "Syllabus" },
  { id: "support", label: "Support (fichier)" },
  { id: "biblio", label: "Bibliographie" },
  { id: "lien", label: "Lien externe" },
];

function ResourcesEditor({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<DBCourseResource[]>([]);
  const [kind, setKind] = useState<ResourceKind>("syllabus");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(0);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => { setResources(await fetchResources(courseId)); }, [courseId]);
  useEffect(() => { reload(); }, [reload]);

  const isFile = kind === "syllabus" || kind === "support";

  const addLink = async () => {
    if (!title.trim()) return;
    await addResource({ program_course_id: courseId, kind, title: title.trim(), url: url.trim() || null, created_by: user?.id ?? null });
    setTitle(""); setUrl("");
    reload();
  };

  const onFile = async (f: File) => {
    setErr(""); setUploading(5);
    const res = await uploadMedia(courseId, f, setUploading);
    if ("error" in res) { setErr(res.error); setUploading(0); return; }
    await addResource({ program_course_id: courseId, kind, title: title.trim() || f.name, url: res.url, size_mo: res.sizeMo, created_by: user?.id ?? null });
    setTitle(""); setUploading(0);
    reload();
  };

  const field = "text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-cama";

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border bg-surface/50 grid sm:grid-cols-[auto_1fr_auto] gap-3 items-end">
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Type</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as ResourceKind)} className={`${field} bg-white`}>
            {RES_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Titre</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Syllabus complet 2025-2026" className={`${field} w-full`} />
        </div>
        {isFile ? (
          <>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading > 0}
              className="btn-primary py-2 px-4 text-xs gap-1.5 h-[38px] disabled:opacity-50">
              <Upload className="w-3.5 h-3.5" /> {uploading > 0 ? `${uploading}%` : "Déposer le fichier"}
            </button>
          </>
        ) : (
          <button onClick={addLink} className="btn-primary py-2 px-4 text-xs gap-1.5 h-[38px]">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        )}
        {!isFile && (
          <div className="sm:col-span-3">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Lien (URL)</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={`${field} w-full`} />
          </div>
        )}
        {err && <p className="sm:col-span-3 text-[10px] text-red-500">{err}</p>}
      </div>
      <div className="divide-y divide-border">
        {resources.length === 0 && <p className="px-5 py-6 text-sm text-muted text-center">Aucune ressource. Ajoutez le syllabus, les supports ou la bibliographie.</p>}
        {resources.map((r) => (
          <div key={r.id} className="px-5 py-3 flex items-center gap-3">
            <span className="text-[9px] font-bold uppercase text-cama bg-cama-50 px-1.5 py-0.5 rounded flex-shrink-0">{RES_KINDS.find((k) => k.id === r.kind)?.label ?? r.kind}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{r.title}</p>
              <p className="text-[10px] text-muted truncate">{r.size_mo ? `${r.size_mo} Mo` : r.url}</p>
            </div>
            <button onClick={async () => { await deleteResource(r.id); reload(); }} className="p-1.5 text-subtle hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Convertit une chaîne horaire ("08h00", "8:30", "18h") en minutes depuis minuit. */
function timeToMinutes(t: string | null): number | null {
  if (!t) return null;
  const m = t.match(/(\d{1,2})\s*[h:]\s*(\d{0,2})/i);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  if (isNaN(hh)) return null;
  return hh * 60 + mm;
}

/* Jour de la semaine (FR) à partir d'une date ISO (YYYY-MM-DD). */
function dayFromISO(iso: string): string {
  if (!iso) return DAYS[0];
  const d = new Date(iso + "T00:00:00");
  // getDay: 0=dim … 6=sam ; DAYS = [Lun..Sam]
  const map = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  return map[d.getDay()] || "Dimanche";
}

/* ════ Planificateur de séances (propositions) ════ */
function SessionPlanner({ courseId, teacherId, courseTitle }: { courseId: string; teacherId: string; courseTitle: string }) {
  const [sessions, setSessions] = useState<DBSession[]>([]);
  const [date, setDate] = useState<string>("");          // YYYY-MM-DD
  const [start, setStart] = useState("08:00");            // HH:MM
  const [end, setEnd] = useState("10:00");
  const [kind, setKind] = useState<SessionKind>("campus");
  const [room, setRoom] = useState("");
  const [modes, setModes] = useState<CycleMode[]>(["presentiel"]);

  const reloadSessions = useCallback(async () => {
    setSessions(await fetchSessions([courseId]));
  }, [courseId]);

  useEffect(() => { reloadSessions(); }, [reloadSessions]);

  const toggleMode = (m: CycleMode) => setModes((arr) => arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m]);

  const day = date ? dayFromISO(date) : "";

  /* Détection de conflits : séances existantes le même jour/date dont la plage horaire chevauche. */
  const conflicts = (() => {
    if (!date || kind === "async") return [];
    const ns = timeToMinutes(start);
    const ne = timeToMinutes(end);
    if (ns === null || ne === null || ne <= ns) return [];
    return sessions.filter((s) => {
      if (s.status === "rejete") return false;
      // même date (week_start) si renseignée, sinon même jour de semaine
      const sameSlot = s.week_start ? s.week_start === date : s.day === day;
      if (!sameSlot) return false;
      const ss = timeToMinutes(s.start_time);
      const se = timeToMinutes(s.end_time) ?? (ss !== null ? ss + 60 : null);
      if (ss === null || se === null) return false;
      return ns < se && ss < ne; // chevauchement
    });
  })();

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  const timeInvalid = kind !== "async" && (startMin === null || endMin === null || endMin <= startMin);
  const canPropose = !!date && modes.length > 0 && conflicts.length === 0 && !timeInvalid;

  // Affichage "08h00" à partir de "08:00"
  const fmt = (t: string) => t.replace(":", "h");

  const propose = async () => {
    if (!canPropose) return;
    await upsertSession({
      program_course_id: courseId, title: courseTitle,
      day, start_time: fmt(start), end_time: kind === "async" ? null : fmt(end),
      kind, room: room.trim() || null, modes, week_start: date || null,
      proposed_by: teacherId, status: "propose", semestre: "S4",
    });
    setRoom("");
    reloadSessions();
  };

  const remove = async (sid: string) => { await deleteSession(sid); reloadSessions(); };

  const STATUS = {
    propose: { label: "En attente de validation", cls: "bg-gold/10 text-gold-dark" },
    valide:  { label: "Validée & planifiée", cls: "bg-green-50 text-green-600" },
    rejete:  { label: "Refusée", cls: "bg-red-50 text-red-500" },
  } as const;
  const field = "text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-cama";
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Formulaire */}
      <div className="p-5 border-b border-border bg-surface/50">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Date</label>
            <input type="date" value={date} min={todayISO} onChange={(e) => setDate(e.target.value)}
              className={`${field} bg-white w-full`} />
            {day && <p className="text-[10px] text-cama font-bold mt-1">{day}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Type</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as SessionKind)} className={`${field} bg-white w-full`}>
              {Object.entries(SESSION_KINDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Début</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`${field} w-full`} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">{kind === "async" ? "— (libre accès)" : "Fin"}</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} disabled={kind === "async"}
              className={`${field} w-full disabled:bg-surface disabled:text-subtle`} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-3 items-end">
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Salle <span className="font-normal">(si campus)</span></label>
            <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Salle B204" className={`${field} w-full`} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Modes concernés</label>
            <div className="flex gap-1.5 flex-wrap">
              {CYCLE_MODES.map((m) => (
                <button key={m.id} onClick={() => toggleMode(m.id)}
                  className={`text-[11px] font-bold px-2.5 py-1.5 border transition-colors ${modes.includes(m.id) ? "text-white border-transparent" : "bg-white text-muted border-border hover:border-ink/40"}`}
                  style={modes.includes(m.id) ? { background: m.color } : undefined}>
                  {m.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Avertissements : date manquante / horaire invalide / conflit */}
        {!date && (
          <p className="text-[11px] text-muted mt-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Choisissez une date pour planifier la séance.
          </p>
        )}
        {timeInvalid && date && (
          <p className="text-[11px] text-red-500 mt-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> L&apos;heure de fin doit être après l&apos;heure de début.
          </p>
        )}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
            <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Conflit d&apos;horaire détecté
            </p>
            {conflicts.map((c) => (
              <p key={c.id} className="text-[11px] text-red-500">
                {c.day} · {c.start_time}{c.end_time ? ` – ${c.end_time}` : ""} — {SESSION_KINDS[c.kind].label}
                {c.room ? ` · ${c.room}` : ""}
              </p>
            ))}
            <p className="text-[10px] text-muted mt-1 italic">Modifiez la date ou l&apos;horaire pour éviter le chevauchement.</p>
          </div>
        )}

        <button onClick={propose} disabled={!canPropose}
          className="btn-primary py-2.5 px-6 text-sm gap-2 mt-4 disabled:opacity-40 disabled:cursor-not-allowed">
          <Send className="w-4 h-4" /> Proposer cette séance
        </button>
      </div>

      {/* Liste */}
      <div className="divide-y divide-border">
        {sessions.length === 0 && <p className="px-5 py-6 text-sm text-muted text-center">Aucune séance proposée pour ce cours.</p>}
        {sessions.map((s) => {
          const k = SESSION_KINDS[s.kind];
          const st = STATUS[s.status];
          return (
            <div key={s.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 border flex-shrink-0 ${k.color}`}>{k.label}</span>
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-subtle" />
                  {s.week_start
                    ? new Date(s.week_start + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })
                    : s.day}
                  {" · "}{s.end_time ? `${s.start_time} – ${s.end_time}` : s.start_time}
                  {s.room && <span className="text-[11px] text-muted font-normal">· {s.room}</span>}
                </p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {s.modes.map((m) => {
                    const mm = CYCLE_MODES.find((x) => x.id === m)!;
                    return <span key={m} className="text-[9px] font-bold px-1.5 py-0.5 text-white" style={{ background: mm.color }}>{mm.short}</span>;
                  })}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 ${st.cls}`}>{st.label}</span>
              <button onClick={() => remove(s.id)} className="p-1.5 text-subtle hover:text-red-500 transition-colors" title="Retirer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
