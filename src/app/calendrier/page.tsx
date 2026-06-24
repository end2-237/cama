"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CalendarDays, GraduationCap, ShieldCheck, Sun,
  BookOpen, Gavel, Award, Download, Settings, Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchCalendar, seedCalendar } from "@/lib/calendar";
import type { DBCalendarEvent } from "@/lib/supabase";

const SEM_META = [
  { n: 1 as const, name: "Semestre 1", period: "Septembre 2025 — Janvier 2026", color: "#4F46E5" },
  { n: 2 as const, name: "Semestre 2", period: "Février 2026 — Juillet 2026", color: "#D97706" },
];

const TYPE_META: Record<string, { label: string; color: string; icon: typeof BookOpen }> = {
  cours:    { label: "Enseignement", color: "text-cama bg-cama/10",        icon: BookOpen },
  examen:   { label: "Examens",      color: "text-red-600 bg-red-50",      icon: ShieldCheck },
  jury:     { label: "Jury",         color: "text-purple-600 bg-purple-50",icon: Gavel },
  resultat: { label: "Résultats",    color: "text-green-600 bg-green-50",  icon: Award },
  admin:    { label: "Administratif",color: "text-slate-600 bg-slate-100", icon: GraduationCap },
  vacances: { label: "Vacances",     color: "text-amber-600 bg-amber-50",  icon: Sun },
  event:    { label: "Événement",    color: "text-blue-600 bg-blue-50",    icon: CalendarDays },
};

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<DBCalendarEvent[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // L'admin amorce le calendrier par défaut s'il est vide ; sinon simple lecture.
      const evts = user.role === "admin" ? await seedCalendar(user.id) : await fetchCalendar();
      setEvents(evts);
      setFetching(false);
    })();
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center gap-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2 flex-1">
            <CalendarDays className="w-4 h-4 text-cama" />
            <p className="text-sm font-bold text-ink">Calendrier académique 2025–2026</p>
          </div>
          {user.role === "admin" && (
            <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-bold text-cama border border-cama/30 rounded px-3 py-1.5 hover:bg-cama/5 transition-colors">
              <Settings className="w-3.5 h-3.5" /> Gérer (onglet Planification)
            </Link>
          )}
          <button className="flex items-center gap-1.5 text-xs font-bold text-cama border border-cama/30 rounded px-3 py-1.5 hover:bg-cama/5 transition-colors">
            <Download className="w-3.5 h-3.5" /> PDF officiel
          </button>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white border border-border p-3 mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mr-2">Légende</span>
          {Object.entries(TYPE_META).map(([k, m]) => (
            <span key={k} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 ${m.color}`}>
              <m.icon className="w-3 h-3" /> {m.label}
            </span>
          ))}
        </div>

        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : (
        <div className="grid md:grid-cols-2 gap-4 items-start">
          {SEM_META.map((s) => {
            const semEvents = events.filter((e) => e.semester === s.n);
            return (
              <section key={s.n} className="bg-white border border-border">
                <div className="px-5 py-4 border-b-2" style={{ borderBottomColor: s.color }}>
                  <h2 className="text-lg font-bold text-ink">{s.name}</h2>
                  <p className="text-xs text-muted">{s.period}</p>
                </div>
                <div className="divide-y divide-border">
                  {semEvents.map((e) => {
                    const m = TYPE_META[e.type] ?? TYPE_META.event;
                    return (
                      <div key={e.id} className="flex items-start gap-3 px-5 py-3 hover:bg-surface transition-colors">
                        <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5 ${m.color.split(" ")[1]}`}>
                          <m.icon className={`w-3.5 h-3.5 ${m.color.split(" ")[0]}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold" style={{ color: s.color }}>{e.date_label}</p>
                          <p className="text-sm text-ink leading-snug">{e.label}</p>
                        </div>
                      </div>
                    );
                  })}
                  {semEvents.length === 0 && <p className="px-5 py-6 text-sm text-muted text-center">Aucun événement pour ce semestre.</p>}
                </div>
              </section>
            );
          })}
        </div>
        )}

        <p className="text-[11px] text-subtle mt-4">
          Document officiel de l&apos;Institut JFN — édité par l&apos;administration depuis l&apos;onglet Planification.
          Les dates d&apos;examens Safe-CAMA peuvent être ajustées par filière ; consultez votre calendrier personnel.
        </p>
      </main>
    </div>
  );
}
