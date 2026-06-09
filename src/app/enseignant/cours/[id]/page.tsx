"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, FileText, Video, MonitorPlay, Radio, Bot,
  Trash2, Upload, Check, X, GripVertical, Eye, EyeOff,
  Sparkles, Calendar, Type, List as ListIcon, HelpCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";
import { uid, BlocNatif } from "@/lib/db";

export default function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { db, mutate } = useDB();
  const [newChap, setNewChap] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "enseignant")) router.replace("/auth/login");
  }, [loading, user, router]);

  const course = db?.courses.find((c) => c.id === id);
  const ue = db?.ues.find((u) => u.id === course?.ueId);
  const chapters = (db?.chapters.filter((c) => c.courseId === id) || []).sort((a, b) => a.order - b.order);

  if (!db || !user || !course) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>;
  }

  const addChapter = () => {
    if (!newChap.trim()) return;
    mutate((d) => {
      d.chapters.push({ id: uid("ch"), courseId: id, order: chapters.length + 1, title: newChap.trim() });
    });
    setNewChap("");
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
            <p className="text-[10px] text-subtle">{ue?.code} · Éditeur de cours</p>
            <p className="text-sm font-bold text-ink truncate">{course.title}</p>
          </div>
          {/* Prof IA toggle */}
          <button
            onClick={() => mutate((d) => { const c = d.courses.find((x) => x.id === id); if (c) c.profIA = !c.profIA; })}
            className={`hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full border-2 transition-all ${
              course.profIA ? "border-cama bg-cama-50 text-cama" : "border-border text-muted"}`}>
            <Bot className="w-4 h-4" /> Prof IA {course.profIA ? "activé" : "désactivé"}
          </button>
          {/* Publication */}
          <button
            onClick={() => mutate((d) => { const c = d.courses.find((x) => x.id === id); if (c) c.published = !c.published; })}
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
                <div className="w-7 h-7 rounded-full bg-cama text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{ch.order}</div>
                <p className="font-bold text-ink flex-1 min-w-0 truncate">{ch.title}</p>
                <div className="flex items-center gap-1.5">
                  {ch.pdf && <span className="badge bg-gold/10 text-gold-dark text-[10px]"><FileText className="w-3 h-3" /> PDF</span>}
                  {ch.video && <span className="badge bg-cama-50 text-cama text-[10px]"><Video className="w-3 h-3" /> Vidéo</span>}
                  {ch.natif && <span className="badge bg-cama-50 text-cama text-[10px]"><MonitorPlay className="w-3 h-3" /> Natif</span>}
                  {ch.liveId && <span className="badge bg-red-50 text-red-500 text-[10px]"><Radio className="w-3 h-3" /> Live</span>}
                </div>
                <button onClick={() => setEditing(editing === ch.id ? null : ch.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${
                    editing === ch.id ? "border-cama bg-cama text-white" : "border-border text-muted hover:border-cama/40"}`}>
                  {editing === ch.id ? "Fermer" : "Gérer les modes"}
                </button>
                <button onClick={() => mutate((d) => { d.chapters = d.chapters.filter((c) => c.id !== ch.id); })}
                  className="p-1.5 text-subtle hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {editing === ch.id && <ChapterModes chapterId={ch.id} />}
            </div>
          ))}
        </div>

        {/* Ajouter chapitre */}
        <div className="mt-6 bg-white rounded-2xl border-2 border-dashed border-border p-5 flex gap-3">
          <input value={newChap} onChange={(e) => setNewChap(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addChapter()}
            placeholder="Titre du nouveau chapitre…"
            className="flex-1 text-sm outline-none text-ink placeholder-subtle min-w-0" />
          <button onClick={addChapter} className="btn-primary gap-2 py-2 px-5 text-sm">
            <Plus className="w-4 h-4" /> Ajouter le chapitre
          </button>
        </div>
      </main>
    </div>
  );
}

/* ════ Gestion des modes d'un chapitre ════ */
function ChapterModes({ chapterId }: { chapterId: string }) {
  const { db, mutate } = useDB();
  const ch = db?.chapters.find((c) => c.id === chapterId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDur, setVideoDur] = useState("20");
  const [liveTitle, setLiveTitle] = useState("");
  const [liveDate, setLiveDate]   = useState("");
  if (!ch) return null;

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
            <button onClick={() => mutate((d) => { const c = d.chapters.find((x) => x.id === chapterId); if (c) delete c.pdf; })}
              className="text-subtle hover:text-red-500"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                mutate((d) => {
                  const c = d.chapters.find((x) => x.id === chapterId);
                  if (c) c.pdf = { name: f.name, sizeMo: Math.max(0.1, Math.round((f.size / 1048576) * 10) / 10), pages: 10 + Math.floor(Math.random() * 20) };
                });
              }} />
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg py-4 text-xs text-muted hover:border-cama/40 hover:text-cama transition-all flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Déposer un PDF (versioning + compression auto)
            </button>
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
              <p className="text-[10px] text-muted">{ch.video.durationMin} min · transcodé 240p→720p · transcription IA générée</p>
            </div>
            <button onClick={() => mutate((d) => { const c = d.chapters.find((x) => x.id === chapterId); if (c) delete c.video; })}
              className="text-subtle hover:text-red-500"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="space-y-2">
            <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Titre de la vidéo"
              className="w-full text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
            <div className="flex gap-2">
              <input value={videoDur} onChange={(e) => setVideoDur(e.target.value)} type="number" min="1" placeholder="Durée (min)"
                className="w-24 text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
              <button
                onClick={() => {
                  if (!videoTitle.trim()) return;
                  mutate((d) => {
                    const c = d.chapters.find((x) => x.id === chapterId);
                    if (c) c.video = { title: videoTitle.trim(), durationMin: parseInt(videoDur) || 20,
                      sizeMo: (parseInt(videoDur) || 20) * 4,
                      transcript: `Transcription automatique (IA) de « ${videoTitle.trim()} » : le contenu intégral de la vidéo est restitué en texte pour permettre l'apprentissage sans téléchargement — un atout majeur en bas-débit.` };
                  });
                  setVideoTitle("");
                }}
                className="flex-1 btn-primary py-2 text-xs justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Uploader (transcodage auto)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mode 3 : Cours natif ── */}
      <div className="bg-white rounded-xl border border-border p-4 md:col-span-2">
        <p className="text-xs font-bold text-ink flex items-center gap-2 mb-3"><MonitorPlay className="w-4 h-4 text-cama" /> Mode 3 — Cours interactif natif (éditeur intégré)</p>
        <NatifEditor chapterId={chapterId} />
      </div>

      {/* ── Mode 4 : Live ── */}
      <div className="bg-white rounded-xl border border-border p-4 md:col-span-2">
        <p className="text-xs font-bold text-ink flex items-center gap-2 mb-3"><Radio className="w-4 h-4 text-red-500" /> Mode 4 — Classe virtuelle en direct</p>
        {ch.liveId ? (
          <LiveStatus liveId={ch.liveId} chapterId={chapterId} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <input value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} placeholder="Titre de la séance"
              className="flex-1 min-w-[180px] text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
            <input value={liveDate} onChange={(e) => setLiveDate(e.target.value)} type="datetime-local"
              className="text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
            <button
              onClick={() => {
                if (!liveTitle.trim()) return;
                mutate((d) => {
                  const liveId = uid("l");
                  d.lives.push({ id: liveId, courseId: ch.courseId, title: liveTitle.trim(),
                    date: liveDate ? new Date(liveDate).toISOString() : new Date(Date.now() + 3600000).toISOString(),
                    durationMin: 60, status: "planifie", replayPublie: false, participants: [] });
                  const c = d.chapters.find((x) => x.id === chapterId);
                  if (c) c.liveId = liveId;
                });
                setLiveTitle("");
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

function LiveStatus({ liveId, chapterId }: { liveId: string; chapterId: string }) {
  const { db, mutate } = useDB();
  const live = db?.lives.find((l) => l.id === liveId);
  if (!live) return null;
  return (
    <div className="flex items-center justify-between bg-red-50/60 border border-red-100 rounded-lg px-3 py-2.5 flex-wrap gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">{live.title}</p>
        <p className="text-[10px] text-muted">
          {new Date(live.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {live.durationMin} min ·{" "}
          <span className={live.status === "encours" ? "text-red-500 font-bold" : ""}>{live.status === "encours" ? "EN DIRECT" : live.status === "termine" ? "Terminé (replay publié)" : "Planifié"}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        {live.status === "planifie" && (
          <button onClick={() => mutate((d) => { const l = d.lives.find((x) => x.id === liveId); if (l) l.status = "encours"; })}
            className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-full hover:bg-red-600 transition-colors">
            Démarrer maintenant
          </button>
        )}
        {live.status === "encours" && (
          <Link href={`/live/${liveId}`} className="text-xs font-bold bg-cama text-white px-3 py-1.5 rounded-full hover:bg-cama-700 transition-colors">
            Entrer dans la salle
          </Link>
        )}
        <button onClick={() => mutate((d) => {
            d.lives = d.lives.filter((l) => l.id !== liveId);
            const c = d.chapters.find((x) => x.id === chapterId);
            if (c) delete c.liveId;
          })}
          className="text-subtle hover:text-red-500"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* ════ Éditeur de cours natif (blocs) ════ */
function NatifEditor({ chapterId }: { chapterId: string }) {
  const { db, mutate } = useDB();
  const ch = db?.chapters.find((c) => c.id === chapterId);
  const blocks = ch?.natif?.blocks || [];
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"titre" | "texte" | "point" | "quiz">("texte");
  const [qOpts, setQOpts] = useState(["", "", ""]);
  const [qGood, setQGood] = useState(0);

  const addBlock = () => {
    if (!text.trim()) return;
    let b: BlocNatif;
    if (kind === "quiz") {
      const opts = qOpts.filter((o) => o.trim());
      if (opts.length < 2) return;
      b = { type: "quiz", question: text.trim(), options: opts, bonne: Math.min(qGood, opts.length - 1) };
    } else {
      b = { type: kind, text: text.trim() } as BlocNatif;
    }
    mutate((d) => {
      const c = d.chapters.find((x) => x.id === chapterId);
      if (!c) return;
      if (!c.natif) c.natif = { blocks: [] };
      c.natif.blocks.push(b);
    });
    setText(""); setQOpts(["", "", ""]);
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
              <button onClick={() => mutate((d) => {
                  const c = d.chapters.find((x) => x.id === chapterId);
                  if (c?.natif) c.natif.blocks.splice(i, 1);
                })}
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
