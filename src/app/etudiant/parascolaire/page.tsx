"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Sparkles, Award, CalendarClock, MapPin, Users, Check,
  GraduationCap, Clock, Server, BadgeCheck, TrendingUp, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  MODE_LABEL, fetchExtraCourses, fetchMyEnrollments, enrollExtra, unenrollExtra,
} from "@/lib/extra";
import {
  CERT_STATUS_META, fetchCertifications, fetchMyCertEnrollments, enrollCertification,
} from "@/lib/certifications";
import type { DBExtraCourse, DBExtraEnrollment, DBCertification, DBCertEnrollment } from "@/lib/supabase";

const EXTRA_IMG: Record<string, string> = {
  "Soft skills":      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=75",
  "Langues":          "https://images.unsplash.com/photo-1543109740-4bdb38fda756?w=600&q=75",
  "Entrepreneuriat":  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=75",
  "Tech":             "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=75",
  "Autre":            "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=75",
};
const CERT_IMG: Record<string, string> = {
  "AWS":       "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=75",
  "Google":    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&q=75",
  "Cisco":     "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=75",
  "Microsoft": "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=600&q=75",
  "CAMA":      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=75",
};

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

  const myExtraCount = myExtra.length;
  const myCertCount = myCerts.length;

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 50%, #7C3AED 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=50')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 pt-6 pb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/60 text-xs hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour au dashboard
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Parascolaire & Certifications</h1>
              <p className="text-white/60 text-sm mt-1 max-w-lg">Enrichissez votre parcours avec des cours hors-cursus et des certifications professionnelles reconnues mondialement.</p>
            </div>
            <div className="hidden sm:flex gap-3">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">{myExtraCount}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Cours inscrits</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">{myCertCount}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Certifications</p>
              </div>
            </div>
          </div>
        </div>
        {/* Tab bar inside hero */}
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 flex gap-0">
          {([["extra", `Cours hors-cursus (${extra.length})`, Sparkles], ["cert", `Certifications (${certs.length})`, Award]] as const).map(([k, lbl, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                tab === k ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
              <Icon className="w-4 h-4" /> {lbl}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : tab === "extra" ? (
          extra.length === 0 ? (
            <Empty icon={Sparkles} title="Aucun cours hors-cursus disponible" sub="Les programmes extra-curriculaires publiés par l'administration apparaîtront ici." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {extra.map((c) => {
                const enr = myExtraMap.get(c.id);
                const img = EXTRA_IMG[c.category] ?? EXTRA_IMG["Autre"];
                return (
                  <div key={c.id} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300">
                    {/* Image header */}
                    <div className="relative h-36 overflow-hidden">
                      <img src={img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full backdrop-blur-sm" style={{ background: `${c.color}CC` }}>{c.category}</span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-base font-bold text-white leading-snug drop-shadow-sm">{c.title}</h3>
                      </div>
                      {enr && (
                        <div className="absolute top-3 right-3">
                          <span className="flex items-center gap-1 text-[9px] font-bold text-white bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-full"><Check className="w-3 h-3" /> Inscrit</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      {c.description && <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">{c.description}</p>}
                      <div className="flex flex-col gap-1.5 text-[11px] text-muted mb-3">
                        {c.instructor_name && <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" style={{ color: c.color }} /> {c.instructor_name}</span>}
                        <span className="flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" style={{ color: c.color }} /> {c.day} · {c.start_time}–{c.end_time}</span>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" style={{ color: c.color }} /> {c.sessions_count} séances</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface">{MODE_LABEL[c.mode]}</span>
                          {c.room && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" style={{ color: c.color }} /> {c.room}</span>}
                        </div>
                      </div>

                      {enr && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[10px] text-muted mb-1"><span>Ma progression</span><span className="font-bold" style={{ color: c.color }}>{enr.progress}%</span></div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${enr.progress}%`, background: c.color }} /></div>
                        </div>
                      )}

                      <div className="mt-auto">
                        <button onClick={() => toggleExtra(c)}
                          className={`w-full py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                            enr ? "border-2 border-green-500 bg-green-50 text-green-600 hover:bg-green-100" : "text-white hover:opacity-90 hover:shadow-md"}`}
                          style={enr ? undefined : { background: c.color }}>
                          {enr ? <><Check className="w-4 h-4" /> Inscrit — se désinscrire</> : <><Users className="w-4 h-4" /> S&apos;inscrire</>}
                        </button>
                      </div>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {certs.map((c) => {
                const enr = myCertMap.get(c.id);
                const st = enr ? CERT_STATUS_META[enr.status] : null;
                const img = CERT_IMG[c.provider] ?? CERT_IMG["CAMA"];
                return (
                  <div key={c.id} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300">
                    {/* Image header with gradient overlay */}
                    <div className="relative h-40 overflow-hidden">
                      <img src={img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.badge_color}DD, #1E1B4BDD)` }} />
                      <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">{c.provider}</span>
                          <span className="text-[10px] font-bold text-white/70">{c.level}</span>
                          {enr && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto ${st?.cls}`}>{st?.label}</span>}
                        </div>
                        <div>
                          <h3 className="text-base font-bold leading-snug drop-shadow-sm">{c.title}</h3>
                          <p className="text-[11px] text-white/70 mt-1 flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.duration_h}h de formation</span>
                            {c.exam_fee && <span>Examen : {c.exam_fee}</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      {c.description && <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-3">{c.description}</p>}

                      {enr && (
                        <div className="mb-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold" style={{ color: c.badge_color }}>{enr.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${enr.progress}%`, background: c.badge_color }} /></div>
                          {enr.score && <p className="text-[10px] text-muted flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Score : {enr.score}</p>}
                        </div>
                      )}

                      <div className="mt-auto flex gap-2">
                        {enr ? (
                          c.environment_url ? (
                            <a href={c.environment_url} target="_blank" rel="noopener noreferrer"
                              className="flex-1 py-2.5 text-sm font-bold rounded-lg text-white flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-md transition-all" style={{ background: c.badge_color }}>
                              <Server className="w-4 h-4" /> Environnement <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="flex-1 py-2.5 text-sm font-bold rounded-lg border-2 border-green-500 bg-green-50 text-green-600 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Inscrit</span>
                          )
                        ) : (
                          <button onClick={() => joinCert(c)}
                            className="flex-1 py-2.5 text-sm font-bold rounded-lg text-white flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-md transition-all" style={{ background: c.badge_color }}>
                            <TrendingUp className="w-4 h-4" /> S&apos;inscrire
                          </button>
                        )}
                      </div>
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
    <div className="bg-white border border-border rounded-xl p-12 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface flex items-center justify-center">
        <Icon className="w-7 h-7 text-subtle" />
      </div>
      <p className="text-sm font-bold text-ink mb-1">{title}</p>
      <p className="text-xs text-muted max-w-md mx-auto">{sub}</p>
    </div>
  );
}
