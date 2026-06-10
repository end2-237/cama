"use client";

import { useState, useRef, useEffect } from "react";
import { MessagesSquare, X, Send, Users, ChevronLeft, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";
import { uid } from "@/lib/db";
import { useDragOffset } from "@/hooks/useDragOffset";

type DMsg = { from: "moi" | "prof"; text: string; time: string };

/* Conversations avec les enseignants (simulées, persistées en session) */
const TEACHERS = [
  {
    id: "amina",
    name: "Pr. Amina Bello",
    initials: "AB",
    color: "bg-gold",
    subject: "INF201 · Structures de données",
    online: true,
    seed: [
      { from: "moi" as const,  text: "Bonsoir Professeure, je n'ai pas compris la rotation droite dans l'AVL.", time: "Hier 18:42" },
      { from: "prof" as const, text: "Bonsoir Jean-Paul. Regardez la vidéo du chapitre 2 à 12:30 — je détaille le pivot. Si ce n'est pas clair, posez la question au live de demain.", time: "Hier 19:10" },
      { from: "moi" as const,  text: "Merci, c'est plus clair avec la vidéo !", time: "Hier 20:05" },
    ],
  },
  {
    id: "kameni",
    name: "Dr. Paul Kameni",
    initials: "PK",
    color: "bg-cama-700",
    subject: "INF202 · Bases de données",
    online: false,
    seed: [
      { from: "prof" as const, text: "Le TP de jeudi portera sur les jointures. Révisez le chapitre 3 avant la séance.", time: "Lun. 09:15" },
    ],
  },
  {
    id: "essomba",
    name: "Mme Essomba",
    initials: "ME",
    color: "bg-green-600",
    subject: "Service pédagogique",
    online: true,
    seed: [
      { from: "prof" as const, text: "Votre demande de changement de groupe TD a été acceptée. Vous êtes désormais dans le groupe B.", time: "Ven. 11:30" },
    ],
  },
];

const PROF_REPLIES = [
  "Bien reçu, je vous réponds en détail dès que possible.",
  "Bonne question — je l'aborderai au prochain live pour tout le groupe.",
  "Consultez la section correspondante du cours natif, puis revenez vers moi si besoin.",
  "C'est noté. Pensez aussi à poser la question sur le forum, elle peut servir aux autres.",
];

export default function DiscussionsDock() {
  const { user } = useAuth();
  const { db, mutate } = useDB();
  const [open, setOpen] = useState(false);
  const { style: dragStyle, bind } = useDragOffset("cama.fab.discussions");
  const [tab, setTab] = useState<"profs" | "forum">("profs");
  const [activeTeacher, setActiveTeacher] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, DMsg[]>>(
    () => Object.fromEntries(TEACHERS.map((t) => [t.id, t.seed]))
  );
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [forumUe, setForumUe] = useState<string | null>(null);
  const [forumInput, setForumInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threads, typing, tab, activeTeacher, db?.forum.length]);

  if (!user || !db) return null;

  const ues = db.ues;
  const currentUe = forumUe ?? ues[0]?.id;
  const forumMsgs = db.forum.filter((f) => f.ueId === currentUe);
  const teacher = TEACHERS.find((t) => t.id === activeTeacher);

  function sendDM() {
    const q = input.trim();
    if (!q || !activeTeacher) return;
    setInput("");
    const now = "À l'instant";
    setThreads((th) => ({ ...th, [activeTeacher]: [...th[activeTeacher], { from: "moi", text: q, time: now }] }));
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setThreads((th) => ({
        ...th,
        [activeTeacher]: [...th[activeTeacher], { from: "prof", text: PROF_REPLIES[Math.floor(Math.random() * PROF_REPLIES.length)], time: "À l'instant" }],
      }));
    }, 1400 + Math.random() * 900);
  }

  function postForum() {
    const q = forumInput.trim();
    if (!q || !currentUe || !user) return;
    mutate((d) => {
      d.forum.push({ id: uid("f"), ueId: currentUe, author: user.name, role: user.role, text: q, time: "À l'instant" });
    });
    setForumInput("");
  }

  return (
    <>
      {/* PANNEAU */}
      {open && (
        <div className="fixed bottom-24 right-[88px] z-50 w-[360px] bg-white border border-border shadow-2xl overflow-hidden animate-scale-in flex flex-col" style={{ height: "500px", ...dragStyle }}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
            {activeTeacher && tab === "profs" ? (
              <button onClick={() => setActiveTeacher(null)} className="p-1 hover:bg-white/15 transition-colors -ml-1">
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <MessagesSquare className="w-5 h-5 text-gold" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-none truncate">
                {activeTeacher && tab === "profs" ? teacher?.name : "Discussions"}
              </p>
              <p className="text-white/60 text-[10px] mt-0.5 truncate">
                {activeTeacher && tab === "profs" ? teacher?.subject : "Enseignants & forum de classe"}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/15 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          {!activeTeacher && (
            <div className="flex border-b border-border flex-shrink-0">
              {([["profs", "Enseignants", GraduationCap], ["forum", "Forum de classe", Users]] as const).map(([k, lbl, Icon]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors border-b-2 ${
                    tab === k ? "text-cama border-cama bg-cama-50/40" : "text-muted border-transparent hover:text-ink"}`}>
                  <Icon className="w-3.5 h-3.5" /> {lbl}
                </button>
              ))}
            </div>
          )}

          {/* ── LISTE DES PROFS ── */}
          {tab === "profs" && !activeTeacher && (
            <div className="flex-1 overflow-y-auto divide-y divide-border min-h-0">
              {TEACHERS.map((t) => {
                const last = threads[t.id][threads[t.id].length - 1];
                return (
                  <button key={t.id} onClick={() => setActiveTeacher(t.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface transition-colors">
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold`}>{t.initials}</div>
                      {t.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-ink truncate">{t.name}</p>
                        <p className="text-[9px] text-subtle flex-shrink-0">{last.time}</p>
                      </div>
                      <p className="text-[10px] text-cama font-medium">{t.subject}</p>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {last.from === "moi" ? "Vous : " : ""}{last.text}
                      </p>
                    </div>
                  </button>
                );
              })}
              <p className="px-4 py-3 text-[10px] text-subtle leading-relaxed">
                Vos enseignants répondent généralement sous 24h. Pour une question de cours, pensez d&apos;abord au Prof IA.
              </p>
            </div>
          )}

          {/* ── CONVERSATION PROF ── */}
          {tab === "profs" && activeTeacher && teacher && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface min-h-0">
                {threads[activeTeacher].map((m, i) => (
                  <div key={i} className={`flex ${m.from === "moi" ? "justify-end" : "justify-start"}`}>
                    {m.from === "prof" && (
                      <div className={`w-6 h-6 rounded-full ${teacher.color} flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-[8px] font-bold text-white`}>{teacher.initials}</div>
                    )}
                    <div className={`max-w-[80%] px-3 py-2 text-xs leading-relaxed ${
                      m.from === "moi" ? "bg-cama text-white" : "bg-white border border-border text-ink"}`}>
                      {m.text}
                      <p className={`text-[8px] mt-1 ${m.from === "moi" ? "text-white/50" : "text-subtle"}`}>{m.time}</p>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className={`w-6 h-6 rounded-full ${teacher.color} flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-[8px] font-bold text-white`}>{teacher.initials}</div>
                    <div className="bg-white border border-border px-4 py-3 flex items-center gap-1">
                      {[0, 1, 2].map((k) => (
                        <span key={k} className="w-1.5 h-1.5 rounded-full bg-subtle animate-bounce" style={{ animationDelay: `${k * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t border-border flex items-center gap-2 flex-shrink-0 bg-white">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendDM()}
                  placeholder={`Écrire à ${teacher.name.split(" ")[0]} ${teacher.name.split(" ")[1] || ""}…`}
                  className="flex-1 text-xs bg-surface border border-border px-3 py-2.5 outline-none focus:border-cama transition-colors min-w-0" />
                <button onClick={sendDM} disabled={!input.trim()}
                  className="w-9 h-9 bg-cama hover:bg-cama-700 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </>
          )}

          {/* ── FORUM DE CLASSE ── */}
          {tab === "forum" && (
            <>
              {/* Sélecteur d'UE */}
              <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto flex-shrink-0">
                {ues.map((u) => (
                  <button key={u.id} onClick={() => setForumUe(u.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 border whitespace-nowrap transition-colors ${
                      currentUe === u.id ? "bg-ink text-white border-ink" : "bg-white text-muted border-border hover:border-ink/40"}`}>
                    {u.code}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface min-h-0">
                {forumMsgs.length === 0 && (
                  <p className="text-xs text-subtle text-center py-6">Aucun message dans ce forum — lancez la discussion !</p>
                )}
                {forumMsgs.map((m) => (
                  <div key={m.id} className="bg-white border border-border p-2.5">
                    <p className="text-[11px] font-bold text-ink flex items-center gap-1.5">
                      {m.author}
                      {m.role === "enseignant" && <span className="text-[8px] bg-gold/15 text-gold-dark px-1.5 py-0.5">Enseignant</span>}
                      <span className="text-[9px] text-subtle font-normal ml-auto">{m.time}</span>
                    </p>
                    <p className="text-xs text-muted leading-relaxed mt-1">{m.text}</p>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t border-border flex items-center gap-2 flex-shrink-0 bg-white">
                <input value={forumInput} onChange={(e) => setForumInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && postForum()}
                  placeholder="Poser une question à la classe…"
                  className="flex-1 text-xs bg-surface border border-border px-3 py-2.5 outline-none focus:border-cama transition-colors min-w-0" />
                <button onClick={postForum} disabled={!forumInput.trim()}
                  className="w-9 h-9 bg-cama hover:bg-cama-700 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB Discussions — à gauche de l'assistant IA */}
      <button
        {...bind}
        style={dragStyle}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-[88px] z-50 w-14 h-14 rounded-full bg-ink hover:bg-charcoal shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
        aria-label="Discussions enseignants & forum"
        title="Discussions — glisser pour déplacer">
        {open
          ? <X className="w-6 h-6 text-white" />
          : (
            <>
              <MessagesSquare className="w-6 h-6 text-gold" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">3</span>
            </>
          )}
      </button>
    </>
  );
}
