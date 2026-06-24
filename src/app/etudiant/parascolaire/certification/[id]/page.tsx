"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Award, Clock, Check, CheckCircle2, Lock, Server, BadgeCheck,
  Trophy, ChevronRight, Target, TrendingUp, ShieldCheck, FileText, Rocket, GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  CERT_STATUS_META, fetchCertifications, fetchMyCertEnrollments, enrollCertification, updateCertEnrollment,
} from "@/lib/certifications";
import type { DBCertification, DBCertEnrollment } from "@/lib/supabase";

const CERT_IMG: Record<string, string> = {
  "AWS":       "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=70",
  "Google":    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&q=70",
  "Cisco":     "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=70",
  "Microsoft": "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=1200&q=70",
  "Oracle":    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&q=70",
  "CompTIA":   "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=70",
  "CAMA":      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=70",
};

/* Étapes jalons d'un parcours de certification. */
const MILESTONES = [
  { key: "inscription", icon: GraduationCap, title: "Inscription validée", desc: "Vous êtes enregistré au parcours de certification.", pct: 0 },
  { key: "apprentissage", icon: FileText, title: "Modules d'apprentissage", desc: "Suivez les modules théoriques et les supports officiels.", pct: 25 },
  { key: "labs", icon: Server, title: "Travaux pratiques (labs)", desc: "Pratiquez dans l'environnement dédié jusqu'à maîtrise.", pct: 55 },
  { key: "blanc", icon: Target, title: "Examen blanc", desc: "Évaluez-vous avec un examen blanc proche du réel.", pct: 80 },
  { key: "examen", icon: ShieldCheck, title: "Examen officiel", desc: "Passez la certification et renseignez votre score.", pct: 100 },
];

export default function CertificationPlayer() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [cert, setCert] = useState<DBCertification | null>(null);
  const [enr, setEnr] = useState<DBCertEnrollment | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scoreInput, setScoreInput] = useState("");

  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); }, [loading, user, router]);

  const reload = useCallback(async () => {
    if (!user || !id) return;
    const [all, mine] = await Promise.all([fetchCertifications(true), fetchMyCertEnrollments(user.id)]);
    setCert(all.find((x) => x.id === id) ?? null);
    setEnr(mine.find((m) => m.certification_id === id) ?? null);
    setFetching(false);
  }, [user, id]);
  useEffect(() => { reload(); }, [reload]);

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 className="w-7 h-7 animate-spin text-cama" />
    </div>
  );
  if (!cert || !user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
      <p className="text-sm font-bold text-ink">Certification introuvable.</p>
      <Link href="/etudiant/parascolaire" className="text-xs font-bold text-cama hover:underline">← Retour au parascolaire</Link>
    </div>
  );

  const progress = enr?.progress ?? 0;
  const img = CERT_IMG[cert.provider] ?? CERT_IMG["CAMA"];
  const st = enr ? CERT_STATUS_META[enr.status] : null;
  const currentMilestone = MILESTONES.filter((m) => progress >= m.pct).length - 1;

  const ensureEnrolled = async (): Promise<DBCertEnrollment | null> => {
    if (enr) return enr;
    await enrollCertification(cert.id, user.id);
    const mine = await fetchMyCertEnrollments(user.id);
    const fresh = mine.find((m) => m.certification_id === cert.id) ?? null;
    setEnr(fresh);
    return fresh;
  };

  const reachMilestone = async (mi: number) => {
    setSaving(true);
    const e = await ensureEnrolled();
    if (!e) { setSaving(false); return; }
    const target = MILESTONES[mi];
    const newProgress = Math.max(progress, target.pct);
    const status = newProgress >= 100 ? "obtenu" : "en_cours";
    const patch: Partial<DBCertEnrollment> = { progress: newProgress, status };
    if (status === "obtenu" && scoreInput.trim()) patch.score = scoreInput.trim();
    await updateCertEnrollment(e.id, patch);
    await reload();
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/etudiant/parascolaire" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Parascolaire
          </Link>
          <div className="w-px h-5 bg-border" />
          <Award className="w-4 h-4" style={{ color: cert.badge_color }} />
          <span className="text-sm font-bold text-ink truncate">{cert.title}</span>
          <div className="flex-1" />
          {st && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-1.5 bg-surface rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: cert.badge_color }} />
            </div>
            <span className="text-xs font-bold" style={{ color: cert.badge_color }}>{progress}%</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden text-white">
        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${cert.badge_color}F0, #1E1B4BF0)` }} />
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 py-7">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">{cert.provider}</span>
            <span className="text-[10px] font-bold text-white/70">{cert.level}</span>
            {cert.code && <span className="text-[10px] font-bold text-white/70">{cert.code}</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight max-w-2xl">{cert.title}</h1>
          {cert.description && <p className="text-white/70 text-sm mt-2 max-w-2xl leading-relaxed">{cert.description}</p>}
          <div className="flex items-center gap-4 mt-4 flex-wrap text-xs text-white/80">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {cert.duration_h}h de formation</span>
            {cert.exam_fee && <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> Examen : {cert.exam_fee}</span>}
            {cert.capacity && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {cert.capacity} places</span>}
          </div>
        </div>
      </div>

      {/* 3-col */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-6 items-start">

        {/* Sidebar gauche : jalons */}
        <aside className="lg:sticky lg:top-[72px] space-y-3">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-black uppercase tracking-widest text-ink">Parcours de certification</p>
            </div>
            <div className="divide-y divide-border">
              {MILESTONES.map((m, i) => {
                const reached = progress >= m.pct;
                const isCurrent = i === currentMilestone + (progress >= 100 ? 0 : 1) && !reached;
                return (
                  <div key={m.key} className="px-4 py-2.5 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: reached ? cert.badge_color : "transparent", border: reached ? "none" : "1.5px solid #e5e7eb" }}>
                      {reached ? <Check className="w-3.5 h-3.5 text-white" /> : <m.icon className="w-3 h-3 text-subtle" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] font-semibold leading-snug ${reached || isCurrent ? "text-ink" : "text-muted"}`}>{m.title}</p>
                      <p className="text-[10px] text-subtle mt-0.5">{m.pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 grid grid-cols-2 gap-3">
            {[
              { icon: Target, label: "Progression", value: `${progress}%` },
              { icon: Clock, label: "Formation", value: `${cert.duration_h}h` },
              { icon: Award, label: "Niveau", value: cert.level },
              { icon: Trophy, label: "Statut", value: st?.label ?? "Non inscrit" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <s.icon className="w-4 h-4 flex-shrink-0" style={{ color: cert.badge_color }} />
                <div>
                  <p className="text-sm font-bold text-ink leading-none truncate">{s.value}</p>
                  <p className="text-[10px] text-muted mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Contenu central : étapes détaillées */}
        <div className="space-y-4">
          {!enr && (
            <div className="rounded-xl p-5 text-white flex items-center gap-4 flex-wrap" style={{ background: `linear-gradient(120deg, ${cert.badge_color}, #1E1B4B)` }}>
              <Rocket className="w-8 h-8 flex-shrink-0" />
              <div className="flex-1 min-w-[180px]">
                <p className="font-bold">Lancez votre parcours {cert.provider}</p>
                <p className="text-white/70 text-xs">Inscrivez-vous pour accéder aux modules et à l&apos;environnement de labs.</p>
              </div>
              <button onClick={() => reachMilestone(0)} disabled={saving}
                className="bg-white text-ink font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Démarrer la certification
              </button>
            </div>
          )}

          {MILESTONES.map((m, i) => {
            const reached = progress >= m.pct;
            const unlocked = i === 0 || progress >= MILESTONES[i - 1].pct;
            const isExam = m.key === "examen";
            return (
              <div key={m.key} className={`bg-white border rounded-xl overflow-hidden ${reached ? "border-border" : unlocked ? "border-border" : "border-border opacity-60"}`}>
                <div className="px-5 py-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: reached ? cert.badge_color : `${cert.badge_color}15`, color: reached ? "#fff" : cert.badge_color }}>
                    {reached ? <CheckCircle2 className="w-5 h-5" /> : unlocked ? <m.icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: cert.badge_color }}>Étape {i + 1}</p>
                    <h2 className="text-base font-bold text-ink">{m.title}</h2>
                    <p className="text-sm text-muted mt-0.5 leading-relaxed">{m.desc}</p>

                    {/* Lab environment link */}
                    {m.key === "labs" && cert.environment_url && unlocked && (
                      <a href={cert.environment_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-white font-bold text-xs px-4 py-2 rounded-lg hover:opacity-90 transition-opacity" style={{ background: cert.badge_color }}>
                        <Server className="w-3.5 h-3.5" /> Ouvrir l&apos;environnement <ChevronRight className="w-3 h-3" />
                      </a>
                    )}

                    {/* Score input on exam */}
                    {isExam && unlocked && !reached && (
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <input value={scoreInput} onChange={(e) => setScoreInput(e.target.value)} placeholder="Score obtenu (ex : 820/1000)"
                          className="text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-cama w-48" />
                      </div>
                    )}

                    {/* Action */}
                    {!reached && unlocked && (
                      <button onClick={() => reachMilestone(i)} disabled={saving}
                        className="mt-3 text-white font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2" style={{ background: cert.badge_color }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {isExam ? "Valider la certification" : "Marquer comme terminé"}
                      </button>
                    )}
                    {reached && <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-green-600"><CheckCircle2 className="w-4 h-4" /> Étape franchie</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Obtenue */}
          {enr?.status === "obtenu" && (
            <div className="bg-white border-2 rounded-xl p-5 text-center" style={{ borderColor: cert.badge_color }}>
              <BadgeCheck className="w-10 h-10 mx-auto mb-2" style={{ color: cert.badge_color }} />
              <p className="text-base font-bold text-ink">Certification obtenue !</p>
              <p className="text-xs text-muted mt-1">Félicitations — {cert.title} ({cert.provider}).</p>
              {enr.score && <p className="text-sm font-bold mt-2" style={{ color: cert.badge_color }}>Score : {enr.score}</p>}
            </div>
          )}
        </div>

        {/* Sidebar droite */}
        <aside className="lg:sticky lg:top-[72px] space-y-3">
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-ink mb-3">Fournisseur</p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0" style={{ background: cert.badge_color }}>
                {cert.provider.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink truncate">{cert.provider}</p>
                <p className="text-[11px] text-muted">{cert.level}</p>
              </div>
            </div>
          </div>

          {cert.environment_url && (
            <a href={cert.environment_url} target="_blank" rel="noopener noreferrer"
              className="block rounded-xl p-4 text-white hover:opacity-95 transition-opacity" style={{ background: `linear-gradient(135deg, ${cert.badge_color}, #1E1B4B)` }}>
              <Server className="w-5 h-5 mb-1.5" />
              <p className="font-bold text-sm leading-snug mb-1">Environnement de labs</p>
              <p className="text-white/70 text-xs leading-relaxed flex items-center gap-1">Accéder à la plateforme dédiée <ChevronRight className="w-3 h-3" /></p>
            </a>
          )}

          <div className="bg-white border border-border rounded-xl p-4 space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-ink mb-1">Détails</p>
            {[
              { icon: Clock, label: `${cert.duration_h}h de formation` },
              { icon: Award, label: `Niveau ${cert.level}` },
              ...(cert.exam_fee ? [{ icon: TrendingUp, label: `Examen : ${cert.exam_fee}` }] : []),
              ...(cert.code ? [{ icon: FileText, label: `Code ${cert.code}` }] : []),
            ].map((r, i) => (
              <p key={i} className="text-[12px] text-muted flex items-center gap-2"><r.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cert.badge_color }} /> {r.label}</p>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
