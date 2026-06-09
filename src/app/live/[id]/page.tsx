"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, Hand,
  PhoneOff, Send, Users, MessageSquare, Radio, Headphones,
  Circle, ChevronLeft, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";
import { uid } from "@/lib/db";

/* Participants simulés */
const FAKE = [
  { name: "Nadia Mbeki",     initials: "NM", color: "bg-cama",     hand: false },
  { name: "Oumarou Moussa",  initials: "OM", color: "bg-gold",     hand: false },
  { name: "Sarah Ateba",     initials: "SA", color: "bg-cama-700", hand: true  },
  { name: "Carine Beyala",   initials: "CB", color: "bg-gold-dark",hand: false },
  { name: "Fatou Sall",      initials: "FS", color: "bg-cama-400", hand: false },
];

const AUTO_MSGS = [
  { author: "Nadia Mbeki",    text: "Très clair, merci !" },
  { author: "Oumarou Moussa", text: "Pouvez-vous remontrer la rotation gauche ?" },
  { author: "Sarah Ateba",    text: "✋ J'ai une question sur le cas de l'arbre dégénéré" },
  { author: "Carine Beyala",  text: "Le replay sera disponible ce soir ?" },
  { author: "Fatou Sall",     text: "Je suis en audio seul, le son est parfait 👌" },
];

export default function LiveRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { db, mutate } = useDB();

  const [mic, setMic]       = useState(true);
  const [cam, setCam]       = useState(true);
  const [share, setShare]   = useState(false);
  const [hand, setHand]     = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [panel, setPanel]   = useState<"chat" | "participants">("chat");
  const [input, setInput]   = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [ended, setEnded]   = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const autoIdx = useRef(0);

  const live = db?.lives.find((l) => l.id === id);
  const isTeacher = user?.role === "enseignant";

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  /* Chrono + messages simulés entrants */
  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    const m = setInterval(() => {
      const msg = AUTO_MSGS[autoIdx.current % AUTO_MSGS.length];
      autoIdx.current += 1;
      mutate((d) => {
        d.chat.push({ id: uid("m"), liveId: id, author: msg.author, role: "etudiant",
          text: msg.text, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) });
      });
    }, 14000);
    return () => { clearInterval(t); clearInterval(m); };
  }, [ended, id, mutate]);

  const msgs = db?.chat.filter((c) => c.liveId === id) || [];
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  if (!db || !user || !live) {
    return <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>;
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const send = () => {
    if (!input.trim()) return;
    mutate((d) => {
      d.chat.push({ id: uid("m"), liveId: id, author: user.name, role: user.role,
        text: input.trim(), time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) });
    });
    setInput("");
  };

  const endLive = () => {
    mutate((d) => {
      const l = d.lives.find((x) => x.id === id);
      if (l) { l.status = "termine"; l.replayPublie = true; }
      /* Le replay est republié comme vidéo (Mode 2) sur le chapitre lié */
      const ch = d.chapters.find((c) => c.liveId === id);
      if (ch && !ch.video) {
        ch.video = { title: `Replay — ${l?.title || "Live"}`, durationMin: Math.max(1, Math.round(elapsed / 60)) || l?.durationMin || 60,
          sizeMo: 95, transcript: "Transcription automatique du live : retrouvez ici l'intégralité des échanges de la séance, générée par IA pour les étudiants en bas-débit qui n'ont pas pu suivre le direct…" };
      }
    });
    setEnded(true);
  };

  if (ended || live.status === "termine") {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md text-center animate-scale-in">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-light text-ink mb-2">Live terminé</h1>
          <p className="text-muted text-sm mb-2">Durée : {fmt(elapsed)} · {live.participants.length + FAKE.length} participants</p>
          <p className="text-sm text-cama font-semibold mb-6">
            ✓ Enregistrement publié comme replay (Mode Vidéo) — personne n&apos;est exclu.
          </p>
          <Link href="/dashboard" className="btn-primary w-full justify-center">Retour au dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-ink flex flex-col overflow-hidden">

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-charcoal border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-white/60 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold truncate">{live.title}</p>
            <p className="text-white/50 text-[11px] flex items-center gap-2">
              <span className="flex items-center gap-1 text-red-400 font-bold">
                <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" /> EN DIRECT
              </span>
              · {fmt(elapsed)}
              <span className="hidden sm:flex items-center gap-1 text-red-300"><Radio className="w-3 h-3" /> Enregistrement en cours</span>
            </p>
          </div>
        </div>
        <button onClick={() => setAudioOnly(!audioOnly)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
            audioOnly ? "border-gold bg-gold text-white" : "border-white/20 text-white/70 hover:border-gold/60"
          }`}>
          <Headphones className="w-3.5 h-3.5" /> Audio seul
        </button>
      </header>

      <div className="flex-1 flex min-h-0">

        {/* ── Scène vidéo ── */}
        <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
          {/* Tuile principale : enseignant ou partage d'écran */}
          <div className={`flex-1 rounded-2xl relative overflow-hidden flex items-center justify-center min-h-0 ${
            audioOnly ? "bg-cama-900" : "bg-charcoal"}`}>
            {audioOnly ? (
              <div className="text-center">
                <Headphones className="w-16 h-16 text-gold mx-auto mb-3" />
                <p className="text-white font-bold">Mode audio seul actif</p>
                <p className="text-white/40 text-sm">~0,3 Mo/min au lieu de 4 Mo/min — le chat reste disponible</p>
                <div className="flex items-center justify-center gap-1 mt-5">
                  {[0,1,2,3,4,5,6].map((i) => (
                    <div key={i} className="w-1.5 bg-gold rounded-full animate-pulse" style={{ height: `${10 + ((i*7)%22)}px`, animationDelay: `${i*100}ms` }} />
                  ))}
                </div>
              </div>
            ) : share && isTeacher ? (
              <div className="absolute inset-0 bg-white m-6 rounded-xl p-6 overflow-hidden">
                <p className="text-xs font-bold text-cama mb-3">Partage d&apos;écran — arbre_binaire.py</p>
                <pre className="text-[11px] text-ink/80 font-mono leading-relaxed">{`class Noeud:
    def __init__(self, valeur):
        self.valeur = valeur
        self.gauche = None
        self.droite = None

def inserer(racine, valeur):
    if racine is None:
        return Noeud(valeur)
    if valeur < racine.valeur:
        racine.gauche = inserer(racine.gauche, valeur)
    else:
        racine.droite = inserer(racine.droite, valeur)
    return racine`}</pre>
              </div>
            ) : (
              <>
                <img src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=1000&q=70"
                  alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-[10px] font-bold text-white">AB</div>
              <p className="text-white text-xs font-bold">Prof. Amina Bello</p>
              <Mic className="w-3.5 h-3.5 text-green-400" />
            </div>
          </div>

          {/* Rangée participants */}
          {!audioOnly && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 flex-shrink-0" style={{ height: 88 }}>
              {/* Moi */}
              <div className="rounded-xl bg-charcoal relative flex items-center justify-center border-2 border-cama">
                <div className={`w-10 h-10 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                  {user.initials}
                </div>
                <span className="absolute bottom-1 left-2 text-[9px] text-white/80 font-bold">Vous</span>
                {!mic && <MicOff className="absolute top-1.5 right-1.5 w-3 h-3 text-red-400" />}
                {hand && <Hand className="absolute top-1.5 left-1.5 w-3.5 h-3.5 text-gold animate-bounce" />}
              </div>
              {FAKE.map((p) => (
                <div key={p.name} className="rounded-xl bg-charcoal relative flex items-center justify-center">
                  <div className={`w-10 h-10 rounded-full ${p.color} flex items-center justify-center text-white text-xs font-bold`}>{p.initials}</div>
                  <span className="absolute bottom-1 left-2 text-[9px] text-white/60 truncate max-w-[80%]">{p.name.split(" ")[0]}</span>
                  {p.hand && <Hand className="absolute top-1.5 left-1.5 w-3.5 h-3.5 text-gold animate-bounce" />}
                </div>
              ))}
            </div>
          )}

          {/* Contrôles */}
          <div className="flex items-center justify-center gap-3 flex-shrink-0 py-1">
            <Ctrl active={mic}  on={Mic}  off={MicOff}    onClick={() => setMic(!mic)}   label="Micro" />
            <Ctrl active={cam && !audioOnly}  on={VideoIcon} off={VideoOff} onClick={() => setCam(!cam)} label="Caméra" />
            {isTeacher && (
              <button onClick={() => setShare(!share)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  share ? "bg-cama text-white" : "bg-white/10 text-white hover:bg-white/20"}`} title="Partager l'écran">
                <MonitorUp className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setHand(!hand)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                hand ? "bg-gold text-white" : "bg-white/10 text-white hover:bg-white/20"}`} title="Lever la main">
              <Hand className="w-5 h-5" />
            </button>
            <button onClick={isTeacher ? endLive : () => router.push("/dashboard")}
              className="h-11 px-5 rounded-full bg-red-500 text-white flex items-center gap-2 font-bold text-sm hover:bg-red-600 transition-colors">
              <PhoneOff className="w-4 h-4" /> {isTeacher ? "Terminer le live" : "Quitter"}
            </button>
          </div>
        </div>

        {/* ── Panneau latéral ── */}
        <aside className="w-80 bg-charcoal border-l border-white/10 flex-col hidden md:flex">
          <div className="flex border-b border-white/10 flex-shrink-0">
            {([["chat", "Chat", MessageSquare], ["participants", `Présents (${FAKE.length + 1})`, Users]] as const).map(([k, lbl, Icon]) => (
              <button key={k} onClick={() => setPanel(k)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors ${
                  panel === k ? "text-white border-b-2 border-cama-400" : "text-white/40 hover:text-white/70"}`}>
                <Icon className="w-3.5 h-3.5" /> {lbl}
              </button>
            ))}
          </div>

          {panel === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {msgs.map((m) => (
                  <div key={m.id} className="text-xs">
                    <p className="font-bold text-white/90 flex items-center gap-1.5">
                      {m.author}
                      {m.role === "enseignant" && <span className="text-[9px] bg-gold/20 text-gold px-1.5 rounded-full">Prof</span>}
                      <span className="text-white/30 font-normal ml-auto">{m.time}</span>
                    </p>
                    <p className="text-white/60 leading-relaxed mt-0.5">{m.text}</p>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t border-white/10 flex gap-2 flex-shrink-0">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Écrire un message…"
                  className="flex-1 bg-white/10 text-white text-xs rounded-full px-3.5 py-2.5 outline-none placeholder-white/30 min-w-0" />
                <button onClick={send} className="w-9 h-9 rounded-full bg-cama text-white flex items-center justify-center flex-shrink-0 hover:bg-cama-700 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {[{ name: "Prof. Amina Bello", initials: "AB", color: "bg-gold", role: "Enseignante", hand: false },
                { name: user.name + " (vous)", initials: user.initials, color: user.avatarColor, role: user.roleLabel, hand },
                ...FAKE.map((f) => ({ ...f, role: "Étudiant" }))].map((p) => (
                <div key={p.name} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5">
                  <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white text-[10px] font-bold`}>{p.initials}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/90 text-xs font-semibold truncate">{p.name}</p>
                    <p className="text-white/40 text-[10px]">{p.role}</p>
                  </div>
                  {p.hand && <Hand className="w-3.5 h-3.5 text-gold" />}
                  <Mic className="w-3.5 h-3.5 text-green-400/60" />
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Ctrl({ active, on: On, off: Off, onClick, label }: {
  active: boolean; on: typeof Mic; off: typeof Mic; onClick: () => void; label: string;
}) {
  return (
    <button onClick={onClick} title={label}
      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
        active ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/90 text-white"}`}>
      {active ? <On className="w-5 h-5" /> : <Off className="w-5 h-5" />}
    </button>
  );
}
