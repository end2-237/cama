"use client";

import Link from "next/link";
import {
  X, CalendarClock, MapPin, Clock, BookOpen, Settings,
  Building2, Radio, MonitorPlay, ShieldCheck, Wifi,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";
import { CYCLE_MODES, SESSION_KINDS, DAYS, modeMeta, studentMode, weeklyForMode } from "@/lib/scheduling";
import type { SessionKind } from "@/lib/db";

const MODE_ICON = { online: Wifi, hybride: MapPin, presentiel: Building2 } as const;
const KIND_ICON: Record<SessionKind, typeof Radio> = {
  campus: Building2, live: Radio, async: MonitorPlay, examen: ShieldCheck,
};

export default function PersonalCalendarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { db } = useDB();

  const mode = db && user ? studentMode(db.studentSettings, user.id) : "presentiel";
  const meta = modeMeta(mode);
  const ModeIcon = MODE_ICON[mode];
  const schedule = db ? weeklyForMode(db.sessions, mode) : {};
  const totalSessions = Object.values(schedule).reduce((a, s) => a + s.length, 0);

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 z-[150] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} />

      <div className={`fixed top-0 right-0 bottom-0 z-[160] w-full lg:w-[78%] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>

        {/* Header */}
        <div className="px-5 py-4 text-white flex items-start gap-3" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
          <div className="w-10 h-10 bg-white/15 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">Mon calendrier personnel</p>
            <p className="text-white/60 text-xs">{user?.level ? `Licence ${user.school?.replace("École d'", "").replace("École de ", "")} ${user.level}` : "Mon parcours"} · Semestre 4 · 2025–2026</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/15 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Mode d'inscription (réel, depuis les réglages) */}
        <div className="px-5 py-3 border-b border-border bg-surface flex items-center gap-3 flex-wrap">
          <ModeIcon className="w-4 h-4" style={{ color: meta.color }} />
          <div className="flex-1 min-w-[180px]">
            <p className="text-sm font-bold text-ink">Mode d&apos;inscription : <span style={{ color: meta.color }}>{meta.label}</span></p>
            <p className="text-[11px] text-muted">{meta.desc}</p>
          </div>
          <Link href="/parametres" onClick={onClose}
            className="flex items-center gap-1.5 text-[11px] font-bold text-cama border border-cama/30 px-3 py-1.5 hover:bg-cama/5 transition-colors">
            <Settings className="w-3.5 h-3.5" /> Changer dans mes réglages
          </Link>
        </div>

        {/* Semaine */}
        <div className="flex-1 overflow-y-auto p-4">
          {totalSessions === 0 ? (
            <div className="border-2 border-dashed border-border p-10 text-center">
              <CalendarClock className="w-8 h-8 text-subtle mx-auto mb-3" />
              <p className="text-sm font-bold text-ink">Aucune séance planifiée pour ce mode</p>
              <p className="text-xs text-muted mt-1">Les séances apparaissent ici une fois validées et planifiées par l&apos;administration.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
              {DAYS.map((day) => {
                const slots = schedule[day] || [];
                return (
                  <div key={day} className="border border-border bg-white">
                    <div className="px-3 py-2 bg-ink flex items-center justify-between">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">{day}</p>
                      <p className="text-[10px] text-white/50">{slots.length === 0 ? "Libre" : `${slots.length} séance(s)`}</p>
                    </div>
                    <div className="divide-y divide-border">
                      {slots.map((s) => {
                        const k = SESSION_KINDS[s.kind];
                        const KIcon = KIND_ICON[s.kind];
                        return (
                          <div key={s.id} className="px-3 py-2.5 flex items-start gap-2.5 hover:bg-surface transition-colors">
                            <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 border ${k.color}`}>
                              <KIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-[10px] font-bold text-ink flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-subtle" /> {s.end ? `${s.start} – ${s.end}` : s.start}
                                </p>
                                <span className={`text-[8px] font-bold px-1 py-0.5 border ${k.color}`}>{k.label}</span>
                              </div>
                              <p className="text-xs text-ink leading-snug mt-0.5 font-medium">{s.title}</p>
                              <p className="text-[9px] text-muted flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" /> {db?.ues.find((u) => u.id === s.ueId)?.code || s.ueId}</span>
                                {s.room && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {s.room}</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {slots.length === 0 && <p className="px-3 py-3 text-[11px] text-subtle italic">Aucune séance — travail personnel.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-between flex-wrap gap-2">
          <p className="text-[10px] text-muted">Planning synchronisé avec les séances validées par l&apos;administration · {CYCLE_MODES.find((m) => m.id === mode)?.label}</p>
          <Link href="/calendrier" onClick={onClose} className="text-[11px] font-bold text-cama hover:underline">Calendrier annuel →</Link>
        </div>
      </div>
    </>
  );
}
