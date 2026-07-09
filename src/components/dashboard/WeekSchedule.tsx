"use client";

/* ════════════════════════════════════════════════════════════
   PLANNING DE LA SEMAINE (étudiant) — emploi du temps réel.

   • Affiche la semaine EN COURS (lundi → samedi), datée dynamiquement.
   • Séances tirées des réservations de salles (room_bookings) des cours
     de la filière + niveau de l'étudiant : hebdomadaires (répétées chaque
     semaine) et ponctuelles (si elles tombent dans la semaine courante).
   • Si aucun cours n'est planifié cette semaine → n'affiche rien (message).
   • Se met à jour au chargement : reflète les changements d'emploi du temps.
════════════════════════════════════════════════════════════ */
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchProgram } from "@/lib/program";
import { fetchBookings, fetchRooms, type DBRoomBooking, type DBRoom } from "@/lib/scheduling";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface Session {
  dayIdx: number;        // 0=lundi..5=samedi
  start: string;         // "HH:MM"
  end: string;
  title: string;
  room: string | null;
}

/** Lundi de la semaine courante (00:00). */
function mondayOf(d: Date): Date {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // 0=lundi..6=dimanche
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function WeekSchedule() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const parcours = user?.dossier?.parcoursSlug ?? "";
  const level = user?.dossier?.level ?? user?.level ?? "";

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [courses, bookings, rooms] = await Promise.all([fetchProgram(), fetchBookings(), fetchRooms()]);
        // Cours de la filière + niveau de l'étudiant.
        const mine = courses.filter((c) => c.parcours_slug === parcours && (!level || c.annee_niveau === level));
        const mineIds = new Set(mine.map((c) => c.id));
        const courseLabel = new Map(mine.map((c) => [c.id, `${c.code} · ${c.title}`]));
        const roomName = new Map<string, string>((rooms as DBRoom[]).map((r) => [r.id, r.name]));

        const monday = mondayOf(new Date());
        const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);

        const out: Session[] = [];
        for (const b of bookings as DBRoomBooking[]) {
          if (!b.program_course_id || !mineIds.has(b.program_course_id)) continue;
          const title = courseLabel.get(b.program_course_id) ?? b.title ?? "Cours";
          const room = b.room_id ? roomName.get(b.room_id) ?? null : null;

          if (b.weekly && b.day != null && b.start_time) {
            // Hebdomadaire → présent chaque semaine, donc cette semaine.
            out.push({ dayIdx: b.day, start: b.start_time, end: b.end_time ?? "", title, room });
          } else if (b.starts_at) {
            // Ponctuel → seulement s'il tombe dans la semaine courante.
            const dt = new Date(b.starts_at);
            if (dt >= monday && dt < nextMonday) {
              const dayIdx = (dt.getDay() + 6) % 7;
              if (dayIdx <= 5) {
                const hh = String(dt.getHours()).padStart(2, "0");
                const mm = String(dt.getMinutes()).padStart(2, "0");
                out.push({ dayIdx, start: `${hh}:${mm}`, end: "", title, room });
              }
            }
          }
        }
        out.sort((a, b) => a.dayIdx - b.dayIdx || a.start.localeCompare(b.start));
        if (alive) setSessions(out);
      } catch {
        if (alive) setSessions([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [parcours, level]);

  const monday = mondayOf(new Date());
  const todayIdx = (new Date().getDay() + 6) % 7;
  const byDay = DAYS.map((_, i) => sessions.filter((s) => s.dayIdx === i));
  const hasAny = sessions.length > 0;

  const fmtDate = (i: number) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest">Cette semaine</h2>
        <span className="text-[10px] text-subtle inline-flex items-center gap-1">
          <CalendarDays className="w-3 h-3" /> {fmtDate(0)} – {fmtDate(5)}
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-muted">Chargement du planning…</p>
      ) : !hasAny ? (
        <p className="text-xs text-muted">Aucun cours planifié cette semaine.</p>
      ) : (
        <div className="space-y-2.5">
          {byDay.map((list, i) =>
            list.length === 0 ? null : (
              <div key={i}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-black ${i === todayIdx ? "text-cama" : "text-ink"}`}>{DAYS[i]}</span>
                  <span className="text-[10px] text-subtle">{fmtDate(i)}</span>
                  {i === todayIdx && <span className="text-[9px] font-bold text-cama bg-cama-50 px-1.5 rounded-full">aujourd&apos;hui</span>}
                </div>
                <div className="space-y-1">
                  {list.map((s, k) => (
                    <div key={k} className="flex items-start gap-2 pl-0.5">
                      <span className="text-[11px] font-bold text-cama tabular-nums whitespace-nowrap inline-flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{s.start}{s.end ? `–${s.end}` : ""}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-ink leading-snug truncate">{s.title}</p>
                        {s.room && <p className="text-[10px] text-subtle inline-flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{s.room}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
