"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Radio, Circle, Users, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchLive, setLiveStatus, logLiveJoin, logLiveLeave } from "@/lib/lives";
import { supabase } from "@/lib/supabase";
import type { DBProgramCourse } from "@/lib/supabase";
import JitsiRoom from "@/components/JitsiRoom";

export default function LiveRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const [lateBlocked, setLateBlocked] = useState<number | null>(null); // minutes de retard si refusé
  const [modeBlocked, setModeBlocked] = useState<{ reason: string; replay: string | null } | null>(null);

  const isTeacher = user?.role === "enseignant" || user?.role === "admin";
  const room = `CAMA-${id}`;

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  /* Présence automatique : journalise entrée/sortie de TOUT participant.
     Étudiant en retard au-delà du délai max du cours → accès refusé. */
  useEffect(() => {
    if (loading || !user || id === "demo") return;
    let active = true;
    let joined = false;
    const leave = () => { if (joined) logLiveLeave(id, user.id).catch(() => {}); };

    (async () => {
      const live = await fetchLive(id);
      if (!live || !active) return;
      /* Accès par cycle : online → live à l'heure sinon replay ;
         présentiel → consultation du direct uniquement ; hybride → accès direct. */
      if (user.role === "etudiant") {
        const mode = user.dossier?.mode ?? "presentiel";
        if (mode !== "hybride" && live.status !== "encours") {
          if (active) setModeBlocked({
            reason: mode === "online"
              ? "Hors horaire : ce live n'est pas en cours. Regardez l'enregistrement ci-dessous."
              : "Cycle présentiel : la salle n'est ouverte que pendant le direct.",
            replay: mode === "online" ? (live.recording_url ?? null) : null,
          });
          return;
        }
      }
      if (user.role === "etudiant" && live.started_at) {
        const { data } = await supabase.from("program_courses").select("*")
          .eq("id", live.program_course_id ?? "").maybeSingle();
        const course = data as DBProgramCourse | null;
        const maxDelay = course?.live_max_join_delay_min ?? 15;
        const delayMin = (Date.now() - new Date(live.started_at).getTime()) / 60000;
        if (delayMin > maxDelay) {
          if (active) setLateBlocked(Math.round(delayMin));
          await logLiveJoin(id, user.id, user.role);      // trace le retard (comptera absent)
          await logLiveLeave(id, user.id);
          return;
        }
      }
      await logLiveJoin(id, user.id, user.role);
      joined = true;
      window.addEventListener("beforeunload", leave);
    })();

    return () => {
      active = false;
      window.removeEventListener("beforeunload", leave);
      leave();
    };
  }, [id, user, loading]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Présence enseignant : entrée → live « en cours », sortie → « terminé ».
  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "enseignant" && user.role !== "admin") return;
    if (id === "demo") return;

    let active = true;
    let started = false;
    const onUnload = () => { setLiveStatus(id, "termine").catch(() => {}); };

    (async () => {
      try {
        const live = await fetchLive(id);
        if (!live || !active) return;
        started = true;
        await setLiveStatus(id, "encours");
        window.addEventListener("beforeunload", onUnload);
      } catch {
        // silencieux
      }
    })();

    return () => {
      active = false;
      window.removeEventListener("beforeunload", onUnload);
      if (started) setLiveStatus(id, "termine").catch(() => {});
    };
  }, [id, user, loading]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
    </div>
  );

  /* Accès refusé par cycle : online hors horaire (→ replay) ou présentiel hors direct */
  if (modeBlocked) return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-4">
      <div className="bg-white border border-border p-8 text-center max-w-sm">
        <Radio className="w-10 h-10 text-cama mx-auto mb-3" />
        <p className="text-sm font-bold text-ink mb-1">Salle live fermée</p>
        <p className="text-xs text-muted mb-4">{modeBlocked.reason}</p>
        {modeBlocked.replay ? (
          <a href={modeBlocked.replay} target="_blank" rel="noreferrer"
            className="inline-block text-xs font-bold bg-cama text-white px-4 py-2 hover:bg-cama-700 mb-2">
            ▶ Regarder le replay
          </a>
        ) : (
          <p className="text-[11px] text-subtle mb-2">Aucun enregistrement disponible pour le moment.</p>
        )}
        <div>
          <Link href="/dashboard" className="text-xs font-bold text-cama hover:underline">← Retour au dashboard</Link>
        </div>
      </div>
    </div>
  );

  /* Étudiant refusé pour retard : au-delà du délai max configuré par le prof */
  if (lateBlocked !== null) return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-4">
      <div className="bg-white border border-border p-8 text-center max-w-sm">
        <Lock className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-sm font-bold text-ink mb-1">Accès refusé — retard de {lateBlocked} min</p>
        <p className="text-xs text-muted mb-4">
          Le délai maximum de connexion fixé par l&apos;enseignant est dépassé.
          Votre tentative est enregistrée : vous êtes compté <strong>absent</strong> à cette séance.
        </p>
        <Link href="/dashboard" className="inline-block text-xs font-bold bg-cama text-white px-4 py-2 hover:bg-cama-700">← Retour au dashboard</Link>
      </div>
    </div>
  );

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="h-screen flex flex-col bg-ink">
      {/* Barre supérieure */}
      <header className="flex items-center gap-3 px-4 h-12 bg-[#111827] border-b border-white/10 flex-shrink-0">
        <button onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Quitter
        </button>
        <div className="w-px h-5 bg-white/15" />
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> EN DIRECT
          </span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-xs text-white/70 font-mono flex items-center gap-1">
            <Circle className="w-2 h-2 fill-red-500 text-red-500" /> {mm}:{ss}
          </span>
        </div>
        <div className="flex-1" />
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-white/60">
          <Users className="w-3.5 h-3.5" /> Salle {room}
        </span>
        {isTeacher && (
          <span className="text-[10px] font-bold bg-cama text-white px-2 py-0.5 rounded-full">Modérateur</span>
        )}
        <Link href="/" className="flex items-center gap-1.5 ml-2">
          <div className="w-1 h-5 bg-gradient-to-b from-cama to-gold rounded-full" />
          <span className="text-sm font-bold text-white tracking-tight">CA<span className="text-cama">MA</span></span>
        </Link>
      </header>

      {/* Visio Jitsi plein écran */}
      <div className="flex-1 min-h-0">
        <JitsiRoom
          room={room}
          displayName={user.name}
          email={user.email}
          isModerator={isTeacher}
          onLeave={() => router.push("/dashboard")}
        />
      </div>

      {/* Pied — info replay */}
      <footer className="flex items-center gap-2 px-4 h-9 bg-[#111827] border-t border-white/10 flex-shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        <p className="text-[11px] text-white/60">
          Caméra, micro, partage d&apos;écran et chat sont gérés dans la fenêtre vidéo. Le lien de salle est partagé par tous les participants du cours.
        </p>
      </footer>
    </div>
  );
}
