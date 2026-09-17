"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Plus, Trash2, Layers, ListTree, AlertCircle } from "lucide-react";
import PageShell from "@/components/dashboard/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import {
  fetchTracks, fetchLevels, createTrack, deleteTrack, createLevel, deleteLevel,
  type DBTrack, type DBLevel,
} from "@/lib/program";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function CursusPage() {
  const { user } = useAuth();
  const { org, terms } = useOrg();
  const [tracks, setTracks] = useState<DBTrack[]>([]);
  const [levels, setLevels] = useState<DBLevel[]>([]);
  const [fetching, setFetching] = useState(true);
  const [err, setErr] = useState("");

  const [trackTitle, setTrackTitle] = useState("");
  const [levelCode, setLevelCode] = useState("");
  const [levelTitle, setLevelTitle] = useState("");

  async function reload() {
    const [t, l] = await Promise.all([fetchTracks(), fetchLevels()]);
    setTracks(t); setLevels(l); setFetching(false);
  }
  useEffect(() => { reload(); }, []);

  async function addTrack() {
    setErr("");
    if (!trackTitle.trim()) return;
    const { error } = await createTrack({ slug: slugify(trackTitle), title: trackTitle.trim(), ordre: tracks.length + 1 });
    if (error) { setErr(error.message); return; }
    setTrackTitle(""); reload();
  }
  async function addLevel() {
    setErr("");
    if (!levelCode.trim()) return;
    const { error } = await createLevel({ code: levelCode.trim(), title: (levelTitle.trim() || levelCode.trim()), ordre: levels.length + 1 });
    if (error) { setErr(error.message); return; }
    setLevelCode(""); setLevelTitle(""); reload();
  }

  if (!user || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-6 h-6 animate-spin text-cama" /></div>
  );

  return (
    <PageShell
      title="Cursus & niveaux"
      subtitle={`Définissez les ${terms.programWord.toLowerCase()}s et ${terms.levelWord.toLowerCase()}s de votre établissement.`}
      icon={GraduationCap}
      breadcrumb="Cursus & niveaux"
      maxWidth="max-w-[1100px]"
      context={org.name}
      stats={[
        { label: "Filières", value: tracks.length, accent: "cama" },
        { label: terms.levelWord, value: levels.length, accent: "ink" },
        { label: "Type", value: org.vertical, accent: "gold" },
      ]}
    >
      {err && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4" /> {err}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Filières */}
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-sm font-bold text-ink flex items-center gap-2 mb-3"><ListTree className="w-4 h-4 text-cama" /> Filières</p>
          <div className="flex gap-2 mb-3">
            <input value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)}
              placeholder="Ex. Anglais, Informatique…" className="input-auth" />
            <button onClick={addTrack} className="btn-primary px-4 rounded-xl flex-shrink-0"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1.5">
            {tracks.length === 0 && <p className="text-xs text-muted py-3 text-center">Aucune filière — ajoutez-en une.</p>}
            {tracks.map((t) => (
              <div key={t.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                <div><p className="text-sm font-semibold text-ink">{t.title}</p><p className="text-[10px] text-muted">{t.slug}</p></div>
                <button onClick={() => deleteTrack(t.id).then(reload)} className="p-1.5 rounded-lg hover:bg-red-50 text-subtle hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Niveaux */}
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-sm font-bold text-ink flex items-center gap-2 mb-3"><Layers className="w-4 h-4 text-cama" /> {terms.levelWord}</p>
          <div className="flex gap-2 mb-3">
            <input value={levelCode} onChange={(e) => setLevelCode(e.target.value)}
              placeholder="Code (A1, L1…)" className="input-auth w-28 flex-shrink-0" />
            <input value={levelTitle} onChange={(e) => setLevelTitle(e.target.value)}
              placeholder="Libellé (optionnel)" className="input-auth" />
            <button onClick={addLevel} className="btn-primary px-4 rounded-xl flex-shrink-0"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1.5">
            {levels.length === 0 && <p className="text-xs text-muted py-3 text-center">Aucun niveau — ajoutez-en un.</p>}
            {levels.map((l) => (
              <div key={l.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-cama bg-cama/8 rounded px-2 py-0.5">{l.code}</span>
                  <p className="text-sm text-ink">{l.title}</p>
                </div>
                <button onClick={() => deleteLevel(l.id).then(reload)} className="p-1.5 rounded-lg hover:bg-red-50 text-subtle hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted mt-4">
        Ces filières et niveaux alimentent l'inscription et la page « Programme ». Si vous n'en définissez aucun,
        l'établissement utilise la structure par défaut.
      </p>
    </PageShell>
  );
}
