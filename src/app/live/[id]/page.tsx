"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Radio, Circle, Users, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import JitsiRoom from "@/components/JitsiRoom";

export default function LiveRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [elapsed, setElapsed] = useState(0);

  const isTeacher = user?.role === "enseignant" || user?.role === "admin";
  const room = `CAMA-${id}`;

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
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
