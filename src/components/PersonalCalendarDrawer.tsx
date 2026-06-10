"use client";

import { useState } from "react";
import {
  X, CalendarClock, MapPin, Wifi, Building2, Radio, MonitorPlay,
  Clock, BookOpen, ShieldCheck,
} from "lucide-react";

type CycleMode = "presentiel" | "hybride" | "online";

const MODE_META: Record<CycleMode, { label: string; icon: typeof Building2; color: string; desc: string }> = {
  presentiel: { label: "Présentiel",  icon: Building2, color: "#16a34a", desc: "Tous les cours sur le campus de Yaoundé" },
  hybride:    { label: "Hybride",     icon: MapPin,    color: "#D97706", desc: "Campus (mar./jeu.) + plateforme CAMA le reste de la semaine" },
  online:     { label: "100% Online", icon: Wifi,      color: "#4F46E5", desc: "Intégralement sur la plateforme CAMA, lives synchrones inclus" },
};

interface Slot {
  time: string;
  title: string;
  ue: string;
  kind: "campus" | "live" | "async" | "examen";
  room?: string;
}

/* Programme hebdomadaire de Jean-Paul (L2 Info) selon le mode de cycle */
const SCHEDULES: Record<CycleMode, Record<string, Slot[]>> = {
  presentiel: {
    "Lundi":    [{ time: "08h00 – 11h00", title: "Structures de données avancées", ue: "INF201", kind: "campus", room: "Salle B204" },
                 { time: "13h00 – 15h00", title: "Mathématiques discrètes", ue: "MAT203", kind: "campus", room: "Amphi 2" }],
    "Mardi":    [{ time: "08h00 – 10h00", title: "Bases de données", ue: "INF202", kind: "campus", room: "Labo Info 1" },
                 { time: "10h15 – 12h15", title: "TD Arbres binaires", ue: "INF201", kind: "campus", room: "Salle B204" }],
    "Mercredi": [{ time: "08h00 – 11h00", title: "Anglais technique", ue: "LAN201", kind: "campus", room: "Salle C101" }],
    "Jeudi":    [{ time: "08h00 – 11h00", title: "TP Bases de données", ue: "INF202", kind: "campus", room: "Labo Info 2" },
                 { time: "14h00 – 16h00", title: "Contrôle continu", ue: "MAT203", kind: "examen", room: "Amphi 1" }],
    "Vendredi": [{ time: "08h00 – 10h00", title: "Projet tutoré — encadrement", ue: "INF209", kind: "campus", room: "Salle projet" }],
    "Samedi":   [],
  },
  hybride: {
    "Lundi":    [{ time: "Libre accès", title: "Cours natif — Complexité algorithmique", ue: "INF201", kind: "async" },
                 { time: "18h00 – 19h00", title: "Live de synthèse hebdo", ue: "INF201", kind: "live" }],
    "Mardi":    [{ time: "08h00 – 12h00", title: "Journée campus — TD & TP", ue: "INF201 · INF202", kind: "campus", room: "Labo Info 1" }],
    "Mercredi": [{ time: "Libre accès", title: "Vidéos + PDF — Bases de données", ue: "INF202", kind: "async" }],
    "Jeudi":    [{ time: "08h00 – 12h00", title: "Journée campus — cours magistraux", ue: "MAT203 · LAN201", kind: "campus", room: "Amphi 2" },
                 { time: "14h00 – 16h00", title: "Contrôle continu", ue: "MAT203", kind: "examen", room: "Amphi 1" }],
    "Vendredi": [{ time: "Libre accès", title: "Quiz & checkpoints de la semaine", ue: "Toutes UE", kind: "async" },
                 { time: "17h00 – 18h00", title: "Permanence Prof — questions/réponses", ue: "INF201", kind: "live" }],
    "Samedi":   [{ time: "09h00 – 10h30", title: "Live optionnel — préparation examens", ue: "INF201", kind: "live" }],
  },
  online: {
    "Lundi":    [{ time: "Libre accès", title: "Cours natif — Complexité algorithmique", ue: "INF201", kind: "async" },
                 { time: "18h00 – 19h30", title: "Classe virtuelle — Structures de données", ue: "INF201", kind: "live" }],
    "Mardi":    [{ time: "Libre accès", title: "Vidéos (240p–720p) + transcriptions", ue: "INF202", kind: "async" },
                 { time: "18h00 – 19h00", title: "TD virtuel — Arbres binaires", ue: "INF201", kind: "live" }],
    "Mercredi": [{ time: "Libre accès", title: "PDF + quiz — Mathématiques discrètes", ue: "MAT203", kind: "async" }],
    "Jeudi":    [{ time: "18h00 – 19h30", title: "Classe virtuelle — Bases de données", ue: "INF202", kind: "live" },
                 { time: "20h00 – 21h00", title: "Examen blanc Safe-CAMA", ue: "MAT203", kind: "examen" }],
    "Vendredi": [{ time: "Libre accès", title: "Checkpoints + Prof IA — révisions", ue: "Toutes UE", kind: "async" },
                 { time: "17h00 – 18h00", title: "Permanence Prof en ligne", ue: "INF201", kind: "live" }],
    "Samedi":   [{ time: "09h00 – 10h30", title: "Live groupe d'étude (replay dispo)", ue: "INF201", kind: "live" }],
  },
};

const KIND_META: Record<Slot["kind"], { label: string; color: string; icon: typeof Radio }> = {
  campus: { label: "Campus",     color: "text-green-700 bg-green-50 border-green-200",  icon: Building2 },
  live:   { label: "Live CAMA",  color: "text-red-600 bg-red-50 border-red-200",        icon: Radio },
  async:  { label: "Asynchrone", color: "text-cama bg-cama/5 border-cama/20",           icon: MonitorPlay },
  examen: { label: "Évaluation", color: "text-purple-700 bg-purple-50 border-purple-200", icon: ShieldCheck },
};

export default function PersonalCalendarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  /* Mode d'inscription de l'étudiant (hardcodé pour le prototype : Jean-Paul est en hybride) */
  const [mode, setMode] = useState<CycleMode>("hybride");
  const meta = MODE_META[mode];
  const schedule = SCHEDULES[mode];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[150] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[160] w-full max-w-[560px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 text-white flex items-start gap-3"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
          <div className="w-10 h-10 bg-white/15 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">Mon calendrier personnel</p>
            <p className="text-white/60 text-xs">Licence Informatique L2 · Semestre 4 · 2025–2026</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/15 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode du cycle */}
        <div className="px-5 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2 mb-2">
            <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
            <p className="text-sm font-bold text-ink">Mode d&apos;inscription : <span style={{ color: meta.color }}>{meta.label}</span></p>
          </div>
          <p className="text-[11px] text-muted mb-2">{meta.desc}</p>
          {/* Switch démo */}
          <div className="flex gap-1">
            {(Object.keys(MODE_META) as CycleMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`text-[10px] font-bold px-2.5 py-1 border transition-colors ${
                  mode === m ? "bg-ink text-white border-ink" : "bg-white text-muted border-border hover:border-ink/40"
                }`}>
                {MODE_META[m].label}
              </button>
            ))}
            <span className="text-[9px] text-subtle self-center ml-1">(aperçu des 3 modes — prototype)</span>
          </div>
        </div>

        {/* Semaine */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(schedule).map(([day, slots]) => (
            <div key={day} className="border-b border-border">
              <div className="px-5 py-2 bg-surface/60 flex items-center justify-between">
                <p className="text-xs font-bold text-ink uppercase tracking-wider">{day}</p>
                <p className="text-[10px] text-subtle">{slots.length === 0 ? "Libre" : `${slots.length} séance(s)`}</p>
              </div>
              {slots.map((s, i) => {
                const k = KIND_META[s.kind];
                return (
                  <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-surface transition-colors border-t border-border/60 first:border-t-0">
                    <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 border ${k.color}`}>
                      <k.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] font-bold text-ink flex items-center gap-1">
                          <Clock className="w-3 h-3 text-subtle" /> {s.time}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${k.color}`}>{k.label}</span>
                      </div>
                      <p className="text-sm text-ink leading-snug mt-0.5">{s.title}</p>
                      <p className="text-[10px] text-muted flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {s.ue}</span>
                        {s.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.room}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
              {slots.length === 0 && (
                <p className="px-5 py-3 text-xs text-subtle italic">Aucune séance programmée — travail personnel.</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-between">
          <p className="text-[10px] text-muted">Synchronisé avec le calendrier académique JFN</p>
          <a href="/calendrier" className="text-[11px] font-bold text-cama hover:underline">Calendrier annuel →</a>
        </div>
      </div>
    </>
  );
}
