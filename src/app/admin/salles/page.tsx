"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, DoorOpen, Plus, AlertTriangle, Trash2, CalendarRange } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DAYS, fetchRooms, addRoom, setRoomActive,
  fetchBookings, createBooking, deleteBooking,
  conflictsFor, findFreeRooms,
  type DBRoom, type DBRoomBooking,
} from "@/lib/scheduling";
import { fetchProgram } from "@/lib/program";
import type { DBProgramCourse } from "@/lib/supabase";
import { logAudit } from "@/lib/governance";

const KINDS = [
  { id: "salle", label: "Salle" },
  { id: "amphi", label: "Amphi" },
  { id: "labo",  label: "Labo" },
];

export default function AdminSallesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<DBRoom[]>([]);
  const [bookings, setBookings] = useState<DBRoomBooking[]>([]);
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulaire salle
  const [rName, setRName] = useState("");
  const [rKind, setRKind] = useState("salle");
  const [rCap, setRCap] = useState("");
  const [rCampus, setRCampus] = useState("");

  // Formulaire réservation
  const [bRoom, setBRoom] = useState("");
  const [bCourse, setBCourse] = useState("");
  const [bTitle, setBTitle] = useState("");
  const [bWeekly, setBWeekly] = useState(true);
  const [bDay, setBDay] = useState(0);
  const [bStart, setBStart] = useState("08:00");
  const [bEnd, setBEnd] = useState("10:00");
  const [bDate, setBDate] = useState("");
  const [conflicts, setConflicts] = useState<DBRoomBooking[]>([]);
  const [suggestions, setSuggestions] = useState<DBRoom[]>([]);

  // Grille : salle affichée
  const [gridRoom, setGridRoom] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = async () => {
    const [rs, bs, cs] = await Promise.all([fetchRooms(), fetchBookings(), fetchProgram()]);
    setRooms(rs);
    setBookings(bs);
    setCourses(cs);
    setFetching(false);
  };
  useEffect(() => { if (user) reload(); }, [user]);

  const roomName = (id: string | null) => rooms.find((r) => r.id === id)?.name ?? "—";
  const courseTitle = (id: string | null) => courses.find((c) => c.id === id)?.title ?? null;

  const bookingLabel = (b: DBRoomBooking) =>
    b.title || courseTitle(b.program_course_id) || "Réservation";

  const slotLabel = (b: DBRoomBooking) =>
    b.weekly
      ? `${DAYS[b.day ?? 0]} ${b.start_time}–${b.end_time}`
      : `${b.starts_at ? new Date(b.starts_at).toLocaleString("fr-FR") : "?"} → ${b.ends_at ? new Date(b.ends_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "?"}`;

  const createRoom = async () => {
    if (!rName.trim() || saving) return;
    setSaving(true);
    await addRoom({
      name: rName.trim(), kind: rKind,
      capacity: rCap ? parseInt(rCap, 10) : null,
      campus: rCampus.trim() || null,
    });
    setRName(""); setRCap(""); setRCampus("");
    await reload();
    setSaving(false);
  };

  const toggleActive = async (r: DBRoom) => {
    if (saving) return;
    setSaving(true);
    await setRoomActive(r.id, !r.active);
    await reload();
    setSaving(false);
  };

  const book = async () => {
    if (!bRoom || saving) return;
    const candidate = {
      room_id: bRoom,
      weekly: bWeekly,
      day: bWeekly ? bDay : null,
      start_time: bWeekly ? bStart : null,
      end_time: bWeekly ? bEnd : null,
      starts_at: !bWeekly && bDate && bStart ? new Date(`${bDate}T${bStart}`).toISOString() : null,
      ends_at: !bWeekly && bDate && bEnd ? new Date(`${bDate}T${bEnd}`).toISOString() : null,
    };
    if (!bWeekly && (!candidate.starts_at || !candidate.ends_at)) return;

    const found = conflictsFor(candidate, bookings);
    if (found.length > 0) {
      setConflicts(found);
      setSuggestions(bWeekly ? findFreeRooms(bDay, bStart, bEnd, rooms, bookings) : []);
      return; // REFUS de l'enregistrement
    }
    setConflicts([]); setSuggestions([]);
    setSaving(true);
    await createBooking({
      ...candidate,
      program_course_id: bCourse || null,
      title: bTitle.trim() || null,
      booked_by: user!.id,
    });
    await logAudit({
      actorId: user!.id, actorName: user!.name, action: "room.book",
      entity: `room:${bRoom}`,
      detail: `Réservation « ${bTitle.trim() || courseTitle(bCourse) || "Sans titre"} » — ${roomName(bRoom)} · ${bWeekly ? `${DAYS[bDay]} ${bStart}–${bEnd} (hebdo)` : `${bDate} ${bStart}–${bEnd} (ponctuel)`}`,
    });
    setBTitle("");
    await reload();
    setSaving(false);
  };

  const removeBooking = async (id: string) => {
    if (saving) return;
    setSaving(true);
    await deleteBooking(id);
    await reload();
    setSaving(false);
  };

  const gridRoomId = gridRoom || rooms[0]?.id || "";
  const gridBookings = useMemo(
    () => bookings.filter((b) => b.room_id === gridRoomId && b.weekly),
    [bookings, gridRoomId],
  );

  if (loading || fetching || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-6 h-6 animate-spin text-cama" /></div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-[11px] text-muted hover:text-ink"><ArrowLeft className="w-3.5 h-3.5" /> Dashboard</Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-[11px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5 text-cama" /> Salles &amp; réservations
          </span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 py-5 space-y-4">
        {/* ── Volet Salles ─────────────────────────────── */}
        <div className="bg-white border border-border p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Nouvelle salle</p>
          <div className="flex flex-wrap items-center gap-2">
            <input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Nom (ex. Amphi A)"
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama w-40" />
            <select value={rKind} onChange={(e) => setRKind(e.target.value)}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama">
              {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
            <input value={rCap} onChange={(e) => setRCap(e.target.value)} type="number" min={1} placeholder="Capacité"
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama w-24" />
            <input value={rCampus} onChange={(e) => setRCampus(e.target.value)} placeholder="Campus"
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama w-32" />
            <button onClick={createRoom} disabled={!rName.trim() || saving}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white bg-cama px-3 py-2 disabled:opacity-50">
              <Plus className="w-3 h-3" /> Créer
            </button>
          </div>
        </div>

        <div className="bg-white border border-border p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Salles ({rooms.length})</p>
          {rooms.length === 0 && <p className="text-xs text-muted">Aucune salle enregistrée.</p>}
          <div className="space-y-1.5">
            {rooms.map((r) => (
              <div key={r.id} className="flex items-center gap-3 flex-wrap border border-border px-2 py-1.5">
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-bold text-ink">{r.name}</p>
                  <p className="text-[10px] text-muted">
                    {KINDS.find((k) => k.id === r.kind)?.label ?? r.kind}
                    {r.capacity ? ` · ${r.capacity} places` : ""}
                    {r.campus ? ` · ${r.campus}` : ""}
                  </p>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${
                  r.active ? "text-cama border-cama" : "text-muted border-border"}`}>
                  {r.active ? "Active" : "Inactive"}
                </span>
                <button onClick={() => toggleActive(r)} disabled={saving}
                  className="text-[10px] font-bold px-2 py-1 border-2 border-border text-muted hover:border-cama/40 disabled:opacity-50">
                  {r.active ? "Désactiver" : "Activer"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Volet Réservations ───────────────────────── */}
        <div className="bg-white border border-border p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
            <CalendarRange className="w-3.5 h-3.5 text-gold-dark" /> Nouvelle réservation
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select value={bRoom} onChange={(e) => { setBRoom(e.target.value); setConflicts([]); }}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama">
              <option value="">— Salle —</option>
              {rooms.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select value={bCourse} onChange={(e) => setBCourse(e.target.value)}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama max-w-[240px]">
              <option value="">— Cours (optionnel) —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}
            </select>
            <input value={bTitle} onChange={(e) => setBTitle(e.target.value)} placeholder="Titre"
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama w-40" />
            <div className="flex border border-border">
              {[true, false].map((w) => (
                <button key={String(w)} onClick={() => { setBWeekly(w); setConflicts([]); }}
                  className={`text-[10px] font-black uppercase tracking-widest px-2 py-2 ${
                    bWeekly === w ? "bg-cama text-white" : "bg-white text-muted"}`}>
                  {w ? "Hebdo" : "Ponctuel"}
                </button>
              ))}
            </div>
            {bWeekly ? (
              <select value={bDay} onChange={(e) => { setBDay(parseInt(e.target.value, 10)); setConflicts([]); }}
                className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama">
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            ) : (
              <input type="date" value={bDate} onChange={(e) => { setBDate(e.target.value); setConflicts([]); }}
                className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            )}
            <input type="time" value={bStart} onChange={(e) => { setBStart(e.target.value); setConflicts([]); }}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            <input type="time" value={bEnd} onChange={(e) => { setBEnd(e.target.value); setConflicts([]); }}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            <button onClick={book} disabled={!bRoom || !bStart || !bEnd || (!bWeekly && !bDate) || saving}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white bg-cama px-3 py-2 disabled:opacity-50">
              <Plus className="w-3 h-3" /> Réserver
            </button>
          </div>

          {conflicts.length > 0 && (
            <div className="mt-3 border border-red-300 bg-red-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Conflit — réservation refusée
              </p>
              <ul className="space-y-0.5">
                {conflicts.map((c) => (
                  <li key={c.id} className="text-xs text-red-700">
                    {bookingLabel(c)} · {slotLabel(c)}
                  </li>
                ))}
              </ul>
              {suggestions.length > 0 && (
                <p className="mt-2 text-xs text-ink">
                  <span className="font-black uppercase tracking-widest text-[10px] text-gold-dark">Salles libres sur ce créneau : </span>
                  {suggestions.map((s) => s.name).join(", ")}
                </p>
              )}
              {suggestions.length === 0 && bWeekly && (
                <p className="mt-2 text-xs text-muted">Aucune autre salle libre sur ce créneau.</p>
              )}
            </div>
          )}
        </div>

        {/* Grille hebdomadaire par salle */}
        <div className="bg-white border border-border p-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Grille hebdomadaire</p>
            <select value={gridRoomId} onChange={(e) => setGridRoom(e.target.value)}
              className="text-xs px-2 py-1.5 border border-border bg-white outline-none focus:border-cama">
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {rooms.length === 0 ? (
            <p className="text-xs text-muted">Créez d&apos;abord une salle.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-px bg-border min-w-[720px]">
                {DAYS.map((d) => (
                  <div key={d} className="bg-surface px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted">{d}</div>
                ))}
                {DAYS.map((d, i) => {
                  const cell = gridBookings
                    .filter((b) => b.day === i)
                    .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
                  return (
                    <div key={d} className="bg-white p-1.5 min-h-[90px] space-y-1">
                      {cell.map((b) => (
                        <div key={b.id} className="border border-cama/30 bg-cama/5 px-1.5 py-1">
                          <p className="text-[10px] font-bold text-ink leading-tight">{bookingLabel(b)}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gold-dark font-bold">{b.start_time}–{b.end_time}</p>
                            <button onClick={() => removeBooking(b.id)} disabled={saving} title="Supprimer"
                              className="text-muted hover:text-red-600 disabled:opacity-50">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Réservations ponctuelles */}
        {bookings.some((b) => !b.weekly) && (
          <div className="bg-white border border-border p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Réservations ponctuelles</p>
            <div className="space-y-1.5">
              {bookings.filter((b) => !b.weekly).map((b) => (
                <div key={b.id} className="flex items-center gap-3 border border-border px-2 py-1.5">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-ink">{bookingLabel(b)} · {roomName(b.room_id)}</p>
                    <p className="text-[10px] text-muted">{slotLabel(b)}</p>
                  </div>
                  <button onClick={() => removeBooking(b.id)} disabled={saving} title="Supprimer"
                    className="text-muted hover:text-red-600 disabled:opacity-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-subtle">Chaque réservation est tracée dans le journal d&apos;audit (action « room.book »).</p>
      </main>
    </div>
  );
}
