"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Sparkles, Award, CalendarClock, MapPin, Users, Check,
  GraduationCap, Clock, Server, BadgeCheck, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  MODE_LABEL, fetchExtraCourses, fetchMyEnrollments, enrollExtra, unenrollExtra,
} from "@/lib/extra";
import {
  CERT_STATUS_META, fetchCertifications, fetchMyCertEnrollments, enrollCertification,
} from "@/lib/certifications";
import type { DBExtraCourse, DBExtraEnrollment, DBCertification, DBCertEnrollment } from "@/lib/supabase";

export default function ParascolairePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"extra" | "cert">("extra");

  const [extra, setExtra] = useState<DBExtraCourse[]>([]);
  const [myExtra, setMyExtra] = useState<DBExtraEnrollment[]>([]);
  const [certs, setCerts] = useState<DBCertification[]>([]);
  const [myCerts, setMyCerts] = useState<DBCertEnrollment[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); }, [loading, user, router]);

  const reload = useCallback(async () => {
    if (!user) return;
    const [ex, mex, ce, mce] = await Promise.all([
      fetchExtraCourses(true), fetchMyEnrollments(user.id),
      fetchCertifications(true), fetchMyCertEnrollments(user.id),
    ]);
    setExtra(ex); setMyExtra(mex); setCerts(ce); setMyCerts(mce);
    setFetching(false);
  }, [user]);
  useEffect(() => { reload(); }, [reload]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const myExtraMap = new Map(myExtra.map((e) => [e.extra_course_id, e]));
  const myCertMap = new Map(myCerts.map((e) => [e.certification_id, e]));

  const toggleExtra = async (c: DBExtraCourse) => {
    if (myExtraMap.has(c.id)) await unenrollExtra(c.id, user.id);
    else await enrollExtra(c.id, user.id);
    reload();
  };
  const joinCert = async (c: DBCertification) => { await enrollCertification(c.id, user.id); reload(); };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cama" /> Parascolaire & certifications
          </span>
        </div>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex gap-0">
          {([["extra", "Cours hors-cursus", Sparkles], ["cert", "Certifications", Award]] as const).map(([k, lbl, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
                tab === k ? "border-cama text-cama" : "border-transparent text-muted hover:text-ink"}`}>
              <Icon className="w-4 h-4" /> {lbl}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5">
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : tab === "extra" ? (
          extra.length === 0 ? (
            <Empty icon={Sparkles} title="Aucun cours hors-cursus disponible" sub="Les programmes extra-curriculaires publiés par l'administration apparaîtront ici." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {extra.map((c) => {
                const enr = myExtraMap.get(c.id);
                return (
                  <div key={c.id} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col">
                    <div className="h-1.5" style={{ background: c.color }} />
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded" style={{ background: c.color }}>{c.category}</span>
                        <span className="text-[10px] font-bold text-muted">{MODE_LABEL[c.mode]}</span>
                      </div>
                      <h3 className="text-base font-bold text-ink leading-snug">{c.title}</h3>
                      {c.description && <p className="text-xs text-muted leading-relaxed mt-1 line-clamp-2">{c.description}</p>}
                      <div className="flex flex-col gap-1 mt-3 text-[11px] text-muted">
                        {c.instructor_name && <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-cama" /> {c.instructor_name}</span>}
                        <span className="flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5 text-cama" /> {c.day} · {c.start_time}–{c.end_time} · {c.sessions_count} séances</span>
                        {c.room && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cama" /> {c.room}</span>}
                      </div>
                      {enr && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] text-muted mb-1"><span>Ma progression</span><span className="font-bold text-cama">{enr.progress}%</span></div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full" style={{ width: `${enr.progress}%`, background: c.color }} /></div>
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-4">
                      <button onClick={() => toggleExtra(c)}
                        className={`w-full py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          enr ? "border-2 border-green-500 bg-green-50 text-green-600" : "text-white hover:opacity-90"}`}
                        style={enr ? undefined : { background: c.color }}>
                        {enr ? <><Check className="w-4 h-4" /> Inscrit — se désinscrire</> : <><Users className="w-4 h-4" /> S&apos;inscrire</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          certs.length === 0 ? (
            <Empty icon={Award} title="Aucune certification disponible" sub="Les certifications professionnelles (AWS, Cisco, Google…) publiées par l'administration apparaîtront ici." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {certs.map((c) => {
                const enr = myCertMap.get(c.id);
                const st = enr ? CERT_STATUS_META[enr.status] : null;
                return (
                  <div key={c.id} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 text-white" style={{ background: `linear-gradient(120deg, ${c.badge_color}, #1E1B4B)` }}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">{c.provider}</span>
                        <span className="text-[10px] font-bold text-white/70">{c.level}</span>
                      </div>
                      <h3 className="text-base font-bold leading-snug">{c.title}</h3>
                      <p className="text-[11px] text-white/70 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.duration_h}h</span>
                        {c.exam_fee && <span>Examen : {c.exam_fee}</span>}
                      </p>
                    </div>
                    <div className="p-4 flex-1">
                      {c.description && <p className="text-xs text-muted leading-relaxed line-clamp-3">{c.description}</p>}
                      {enr && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st?.cls}`}>{st?.label}</span>
                            <span className="text-[10px] font-bold text-cama">{enr.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full" style={{ width: `${enr.progress}%`, background: c.badge_color }} /></div>
                          {enr.score && <p className="text-[10px] text-muted flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Score : {enr.score}</p>}
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-4 flex gap-2">
                      {enr ? (
                        c.environment_url ? (
                          <a href={c.environment_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-2 text-sm font-bold rounded-lg text-white flex items-center justify-center gap-2 hover:opacity-90" style={{ background: c.badge_color }}>
                            <Server className="w-4 h-4" /> Environnement
                          </a>
                        ) : (
                          <span className="flex-1 py-2 text-sm font-bold rounded-lg border-2 border-green-500 bg-green-50 text-green-600 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Inscrit</span>
                        )
                      ) : (
                        <button onClick={() => joinCert(c)}
                          className="flex-1 py-2 text-sm font-bold rounded-lg text-white flex items-center justify-center gap-2 hover:opacity-90" style={{ background: c.badge_color }}>
                          <TrendingUp className="w-4 h-4" /> S&apos;inscrire
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
    </div>
  );
}

function Empty({ icon: Icon, title, sub }: { icon: typeof Sparkles; title: string; sub: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-10 text-center">
      <Icon className="w-9 h-9 text-subtle mx-auto mb-3" />
      <p className="text-sm font-bold text-ink mb-1">{title}</p>
      <p className="text-xs text-muted max-w-md mx-auto">{sub}</p>
    </div>
  );
}
