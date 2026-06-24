"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Award, Plus, Trash2, Eye, EyeOff, Users, Check,
  Clock, BadgeCheck, Server,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  CERT_PROVIDERS, CERT_LEVELS, CERT_STATUS_META, fetchCertifications, createCertification,
  updateCertification, deleteCertification, fetchCertEnrollments, updateCertEnrollment,
  type CertEnrollmentWithUser,
} from "@/lib/certifications";
import type { DBCertification, CertLevel } from "@/lib/supabase";

const BADGES = ["#F59E0B", "#FF9900", "#1BA0D7", "#4285F4", "#0078D4", "#E00", "#7C3AED"];

export default function AdminCertificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [certs, setCerts] = useState<DBCertification[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<DBCertification | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = useCallback(async () => {
    const list = await fetchCertifications();
    setCerts(list);
    setFetching(false);
    setSelected((s) => (s ? list.find((c) => c.id === s.id) ?? null : null));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cama" /> Certifications professionnelles
          </span>
          <div className="flex-1" />
          <button onClick={() => { setShowForm(true); setSelected(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cama text-white text-xs font-bold rounded-lg hover:bg-cama-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nouvelle certification
          </button>
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-4 sm:px-6 py-5 grid lg:grid-cols-[380px_1fr] gap-5 items-start">
        <div>
          <h2 className="text-[11px] font-black text-ink uppercase tracking-widest mb-2">Catalogue ({certs.length})</h2>
          {fetching ? (
            <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
          ) : certs.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-6 text-center text-xs text-muted">
              Aucune certification. Ajoutez une certification (AWS, Cisco, Google…) que les étudiants pourront passer.
            </div>
          ) : (
            <div className="space-y-2">
              {certs.map((c) => (
                <button key={c.id} onClick={() => { setSelected(c); setShowForm(false); }}
                  className={`w-full text-left bg-white border rounded-xl p-3 hover:border-cama/40 transition-all flex items-center gap-3 ${
                    selected?.id === c.id ? "border-cama shadow-sm" : "border-border"}`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold" style={{ background: c.badge_color }}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{c.title}</p>
                    <p className="text-[11px] text-muted">{c.provider} · {c.level}</p>
                  </div>
                  {c.published
                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full">Publié</span>
                    : <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark rounded-full">Brouillon</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {showForm ? (
          <CertForm createdBy={user.id} onCreated={(c) => { reload(); setSelected(c); setShowForm(false); }} />
        ) : selected ? (
          <CertDetail cert={selected} onChange={reload} />
        ) : (
          <div className="bg-white border border-border rounded-xl p-10 text-center">
            <BadgeCheck className="w-9 h-9 text-subtle mx-auto mb-3" />
            <p className="text-sm font-bold text-ink mb-1">Certifications gérées par l&apos;administration</p>
            <p className="text-xs text-muted max-w-md mx-auto">Créez des parcours certifiants (ex. AWS Cloud Practitioner). Les étudiants s&apos;y inscrivent et travaillent dans l&apos;environnement dédié. Suivez ici leur progression et leurs résultats.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function CertForm({ onCreated, createdBy }: { onCreated: (c: DBCertification) => void; createdBy: string }) {
  const [f, setF] = useState({
    title: "", provider: CERT_PROVIDERS[0] as string, code: "", description: "",
    level: "Fondation" as CertLevel, duration_h: 20, environment_url: "", exam_fee: "",
    badge_color: BADGES[0], capacity: 0,
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!f.title.trim()) return;
    setSaving(true);
    const created = await createCertification({
      ...f, title: f.title.trim(), capacity: f.capacity || null, created_by: createdBy,
    });
    setSaving(false);
    if (created) onCreated(created);
  };

  const field = "w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-cama";
  const lbl = "text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block";

  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-cama" /> Nouvelle certification</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><label className={lbl}>Intitulé</label>
          <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="AWS Certified Cloud Practitioner" className={field} /></div>
        <div><label className={lbl}>Fournisseur</label>
          <select value={f.provider} onChange={(e) => set("provider", e.target.value)} className={`${field} bg-white`}>
            {CERT_PROVIDERS.map((p) => <option key={p}>{p}</option>)}
          </select></div>
        <div><label className={lbl}>Code</label><input value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="CLF-C02" className={field} /></div>
        <div className="sm:col-span-2"><label className={lbl}>Description</label>
          <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Compétences visées, prérequis, débouchés…" className={field} /></div>
        <div><label className={lbl}>Niveau</label>
          <select value={f.level} onChange={(e) => set("level", e.target.value as CertLevel)} className={`${field} bg-white`}>
            {CERT_LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select></div>
        <div><label className={lbl}>Durée (heures)</label><input type="number" min="1" value={f.duration_h} onChange={(e) => set("duration_h", Number(e.target.value))} className={field} /></div>
        <div className="sm:col-span-2"><label className={lbl}>Environnement dédié (URL lab / console)</label>
          <input value={f.environment_url} onChange={(e) => set("environment_url", e.target.value)} placeholder="https://lab.cama.jfn.cm/aws" className={field} /></div>
        <div><label className={lbl}>Frais d&apos;examen</label><input value={f.exam_fee} onChange={(e) => set("exam_fee", e.target.value)} placeholder="Gratuit / 100 USD" className={field} /></div>
        <div><label className={lbl}>Capacité (0 = illimité)</label><input type="number" min="0" value={f.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className={field} /></div>
        <div className="sm:col-span-2"><label className={lbl}>Couleur du badge</label>
          <div className="flex gap-2">
            {BADGES.map((c) => (
              <button key={c} onClick={() => set("badge_color", c)} className={`w-7 h-7 rounded-full transition-transform ${f.badge_color === c ? "ring-2 ring-offset-2 ring-ink scale-110" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
      <button onClick={submit} disabled={saving || !f.title.trim()} className="btn-primary py-2.5 px-6 text-sm gap-2 mt-4 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Créer la certification
      </button>
    </div>
  );
}

function CertDetail({ cert, onChange }: { cert: DBCertification; onChange: () => void }) {
  const [enrollments, setEnrollments] = useState<CertEnrollmentWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => { setEnrollments(await fetchCertEnrollments(cert.id)); setLoading(false); }, [cert.id]);
  useEffect(() => { setLoading(true); reload(); }, [reload]);

  const obtained = enrollments.filter((e) => e.status === "obtenu").length;
  const togglePublish = async () => { await updateCertification(cert.id, { published: !cert.published }); onChange(); };
  const remove = async () => { if (confirm("Supprimer cette certification ?")) { await deleteCertification(cert.id); onChange(); } };

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="p-5 text-white" style={{ background: `linear-gradient(120deg, ${cert.badge_color}, #1E1B4B)` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5">{cert.provider}</span>
                {cert.code && <span className="text-[10px] font-bold text-white/70">{cert.code}</span>}
                <span className="text-[10px] font-bold text-white/70">{cert.level}</span>
              </div>
              <h2 className="text-xl font-bold leading-tight">{cert.title}</h2>
              <p className="text-xs text-white/70 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cert.duration_h}h</span>
                {cert.exam_fee && <span>Examen : {cert.exam_fee}</span>}
                {cert.environment_url && <a href={cert.environment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline"><Server className="w-3 h-3" /> Environnement</a>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={togglePublish}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full transition-all ${cert.published ? "bg-green-500 text-white" : "bg-white/15 text-white hover:bg-white/25"}`}>
                {cert.published ? <><Eye className="w-3.5 h-3.5" /> Publié</> : <><EyeOff className="w-3.5 h-3.5" /> Publier</>}
              </button>
              <button onClick={remove} className="w-9 h-9 bg-white/10 hover:bg-red-500 border border-white/20 rounded-full flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        {cert.description && <p className="px-5 py-3 text-sm text-muted bg-white">{cert.description}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Users, label: "Inscrits", value: String(enrollments.length), c: "text-cama" },
          { icon: BadgeCheck, label: "Obtenues", value: String(obtained), c: "text-green-600" },
          { icon: Award, label: "Taux réussite", value: enrollments.length ? `${Math.round((obtained / enrollments.length) * 100)}%` : "—", c: "text-gold-dark" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-3">
            <s.icon className={`w-4 h-4 mb-1.5 ${s.c}`} />
            <p className={`text-lg font-bold leading-none ${s.c}`}>{s.value}</p>
            <p className="text-[11px] text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[11px] font-black text-ink uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-cama" /> Étudiants inscrits</h3>
        </div>
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
        ) : enrollments.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Aucun étudiant inscrit pour le moment.</p>
        ) : (
          <div className="divide-y divide-border">
            {enrollments.map((e) => <CertRow key={e.id} e={e} onSaved={reload} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CertRow({ e, onSaved }: { e: CertEnrollmentWithUser; onSaved: () => void }) {
  const [progress, setProgress] = useState(e.progress);
  const [status, setStatus] = useState(e.status);
  const [score, setScore] = useState(e.score ?? "");
  const name = `${e.student?.first_name ?? ""} ${e.student?.last_name ?? ""}`.trim() || e.student?.email || "Étudiant";
  const initials = `${(e.student?.first_name ?? "?").charAt(0)}${(e.student?.last_name ?? "").charAt(0)}`.toUpperCase();

  const save = async () => {
    await updateCertEnrollment(e.id, {
      progress, status, score: score || null,
      completed_at: status === "obtenu" || status === "echec" ? new Date().toISOString() : null,
    });
    onSaved();
  };

  return (
    <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
      <div className="w-9 h-9 rounded-full bg-cama-50 text-cama flex items-center justify-center text-[11px] font-bold flex-shrink-0">{initials}</div>
      <div className="flex-1 min-w-[130px]">
        <p className="text-sm font-semibold text-ink truncate">{name}</p>
        <p className="text-[10px] text-subtle">{e.student?.level ?? "—"} · {e.student?.email}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-subtle">Prog.</label>
        <input type="number" min="0" max="100" value={progress} onChange={(ev) => setProgress(Number(ev.target.value))}
          className="w-14 text-xs border border-border rounded px-2 py-1 outline-none focus:border-cama" />
      </div>
      <input value={score} onChange={(ev) => setScore(ev.target.value)} placeholder="Score"
        className="w-20 text-xs border border-border rounded px-2 py-1 outline-none focus:border-cama" />
      <select value={status} onChange={(ev) => setStatus(ev.target.value as typeof status)}
        className="text-[11px] border border-border rounded px-2 py-1 bg-white outline-none focus:border-cama">
        {Object.entries(CERT_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <button onClick={save} className="text-[11px] font-bold text-white bg-cama px-3 py-1.5 rounded hover:bg-cama-700 transition-colors flex items-center gap-1">
        <Check className="w-3 h-3" /> OK
      </button>
    </div>
  );
}
