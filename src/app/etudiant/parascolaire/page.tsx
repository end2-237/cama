"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Sparkles, Award, CalendarClock, Check,
  GraduationCap, Clock, Server, BadgeCheck, TrendingUp, ChevronRight, ChevronLeft,
  PlayCircle, Filter, Flame, Layers, Trophy, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  MODE_LABEL, fetchExtraCourses, fetchMyEnrollments, enrollExtra,
} from "@/lib/extra";
import {
  CERT_STATUS_META, fetchCertifications, fetchMyCertEnrollments, enrollCertification,
} from "@/lib/certifications";
import type { DBExtraCourse, DBExtraEnrollment, DBCertification, DBCertEnrollment } from "@/lib/supabase";

const EXTRA_IMG: Record<string, string> = {
  "Soft skills":      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=75",
  "Langues":          "https://images.unsplash.com/photo-1543109740-4bdb38fda756?w=800&q=75",
  "Entrepreneuriat":  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=75",
  "Tech":             "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=75",
  "Arts & Culture":   "https://images.unsplash.com/photo-1499415479124-43c32433a620?w=800&q=75",
  "Autre":            "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=75",
};
const CERT_IMG: Record<string, string> = {
  "AWS":       "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=75",
  "Google":    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=75",
  "Cisco":     "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=75",
  "Microsoft": "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=800&q=75",
  "Oracle":    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=75",
  "CompTIA":   "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=75",
  "CAMA":      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=75",
};

export default function ParascolairePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"extra" | "cert">("extra");
  const [cat, setCat] = useState<string>("Toutes");

  const [extra, setExtra] = useState<DBExtraCourse[]>([]);
  const [myExtra, setMyExtra] = useState<DBExtraEnrollment[]>([]);
  const [certs, setCerts] = useState<DBCertification[]>([]);
  const [myCerts, setMyCerts] = useState<DBCertEnrollment[]>([]);
  const [fetching, setFetching] = useState(true);
  const [slide, setSlide] = useState(0);

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

  const myExtraMap = useMemo(() => new Map(myExtra.map((e) => [e.extra_course_id, e])), [myExtra]);
  const myCertMap = useMemo(() => new Map(myCerts.map((e) => [e.certification_id, e])), [myCerts]);

  // Slider : éléments en vedette (les premiers publiés du tab courant)
  const featured = useMemo(() => (tab === "extra" ? extra : certs).slice(0, 4), [tab, extra, certs]);
  useEffect(() => { setSlide(0); }, [tab]);
  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const categories = ["Toutes", ...Array.from(new Set(extra.map((c) => c.category)))];
  const filteredExtra = cat === "Toutes" ? extra : extra.filter((c) => c.category === cat);

  const startExtra = async (c: DBExtraCourse) => {
    if (!myExtraMap.has(c.id)) { await enrollExtra(c.id, user.id); await reload(); }
    router.push(`/etudiant/parascolaire/cours/${c.id}`);
  };
  const startCert = async (c: DBCertification) => {
    if (!myCertMap.has(c.id)) { await enrollCertification(c.id, user.id); await reload(); }
    router.push(`/etudiant/parascolaire/certification/${c.id}`);
  };

  // "Mon parcours" : éléments inscrits, tous types confondus
  const enrolledExtra = extra.filter((c) => myExtraMap.has(c.id));
  const enrolledCerts = certs.filter((c) => myCertMap.has(c.id));

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 50%, #7C3AED 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=50')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative mx-auto px-4 sm:px-8 pt-6 pb-8">
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
                <p className="text-2xl font-bold">{extra.length}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Cours dispo</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">{myExtra.length}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Cours inscrits</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">{certs.length}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Certifications</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">{myCerts.length}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Cert. inscrites</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mx-auto px-4 sm:px-8 flex gap-0">
          {([["extra", `Cours hors-cursus (${extra.length})`, Sparkles], ["cert", `Certifications (${certs.length})`, Award]] as const).map(([k, lbl, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                tab === k ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
              <Icon className="w-4 h-4" /> {lbl}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto px-4 sm:px-8 py-4">
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_220px] gap-4 items-start">

            {/* ── SIDEBAR ── */}
            <aside className="space-y-3 lg:sticky lg:top-4">
              {/* Mon parcours */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-cama" />
                  <p className="text-xs font-black uppercase tracking-widest text-ink">Mon parcours</p>
                </div>
                <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
                  {enrolledExtra.length === 0 && enrolledCerts.length === 0 && (
                    <p className="px-4 py-5 text-[11px] text-muted text-center">Aucune inscription pour l&apos;instant. Lancez-vous ci-contre !</p>
                  )}
                  {enrolledExtra.map((c) => {
                    const e = myExtraMap.get(c.id)!;
                    return (
                      <Link key={c.id} href={`/etudiant/parascolaire/cours/${c.id}`} className="block px-4 py-2.5 hover:bg-surface transition-colors">
                        <p className="text-[12px] font-bold text-ink truncate">{c.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${e.progress}%`, background: c.color }} /></div>
                          <span className="text-[10px] font-bold" style={{ color: c.color }}>{e.progress}%</span>
                        </div>
                      </Link>
                    );
                  })}
                  {enrolledCerts.map((c) => {
                    const e = myCertMap.get(c.id)!;
                    return (
                      <Link key={c.id} href={`/etudiant/parascolaire/certification/${c.id}`} className="block px-4 py-2.5 hover:bg-surface transition-colors">
                        <p className="text-[12px] font-bold text-ink truncate flex items-center gap-1"><Award className="w-3 h-3" style={{ color: c.badge_color }} /> {c.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${e.progress}%`, background: c.badge_color }} /></div>
                          <span className="text-[10px] font-bold" style={{ color: c.badge_color }}>{e.progress}%</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Filtres par catégorie (cours uniquement) */}
              {tab === "extra" && categories.length > 1 && (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <Filter className="w-4 h-4 text-cama" />
                    <p className="text-xs font-black uppercase tracking-widest text-ink">Catégories</p>
                  </div>
                  <div className="p-2">
                    {categories.map((c) => (
                      <button key={c} onClick={() => setCat(c)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                          cat === c ? "bg-cama/10 text-cama" : "text-muted hover:bg-surface"}`}>
                        {c}
                        {c !== "Toutes" && <span className="text-[10px] font-bold text-subtle">{extra.filter((x) => x.category === c).length}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Encart présentation */}
              <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #1E1B4B, #4F46E5)" }}>
                <Layers className="w-5 h-5 text-gold mb-1.5" />
                <p className="font-bold text-sm leading-snug mb-1">Apprenez à votre rythme</p>
                <p className="text-white/70 text-xs leading-relaxed">Chaque parcours suit votre progression séance par séance et délivre une attestation à la clé.</p>
              </div>
            </aside>

            {/* ── COLONNE PRINCIPALE ── */}
            <div className="space-y-4">
              {/* Slider vedette */}
              {featured.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72 group">
                  {featured.map((item, i) => {
                    const isExtra = tab === "extra";
                    const c = item as DBExtraCourse & DBCertification;
                    const color = isExtra ? (item as DBExtraCourse).color : (item as DBCertification).badge_color;
                    const img = isExtra ? (EXTRA_IMG[(item as DBExtraCourse).category] ?? EXTRA_IMG["Autre"]) : (CERT_IMG[(item as DBCertification).provider] ?? CERT_IMG["CAMA"]);
                    const tagline = isExtra ? (item as DBExtraCourse).category : `${(item as DBCertification).provider} · ${(item as DBCertification).level}`;
                    return (
                      <div key={item.id} className={`absolute inset-0 transition-opacity duration-700 ${i === slide ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(110deg, ${color}F2 0%, ${color}99 45%, transparent 100%)` }} />
                        <div className="relative h-full flex flex-col justify-end p-6 max-w-lg">
                          <span className="inline-flex w-fit items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full mb-2">
                            <Flame className="w-3 h-3" /> En vedette · {tagline}
                          </span>
                          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow">{c.title}</h2>
                          {c.description && <p className="text-white/80 text-xs mt-1 line-clamp-2 max-w-md">{c.description}</p>}
                          <button onClick={() => (isExtra ? startExtra(item as DBExtraCourse) : startCert(item as DBCertification))}
                            className="mt-3 w-fit bg-white text-ink font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" /> {(isExtra ? myExtraMap.has(item.id) : myCertMap.has(item.id)) ? "Continuer" : "Commencer"} <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {featured.length > 1 && (
                    <>
                      <button onClick={() => setSlide((s) => (s - 1 + featured.length) % featured.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => setSlide((s) => (s + 1) % featured.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 right-4 flex gap-1.5">
                        {featured.map((_, i) => (
                          <button key={i} onClick={() => setSlide(i)} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Grille */}
              {tab === "extra" ? (
                filteredExtra.length === 0 ? (
                  <Empty icon={Sparkles} title="Aucun cours hors-cursus disponible" sub="Les programmes extra-curriculaires publiés par l'administration apparaîtront ici." />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-ink">{cat === "Toutes" ? "Tous les cours" : cat}</h2>
                      <span className="text-xs text-muted">{filteredExtra.length} cours</span>
                    </div>
                    <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                      {filteredExtra.map((c) => {
                        const enr = myExtraMap.get(c.id);
                        const img = EXTRA_IMG[c.category] ?? EXTRA_IMG["Autre"];
                        return (
                          <div key={c.id} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300">
                            <div className="relative h-32 overflow-hidden">
                              <img src={img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                              <span className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full backdrop-blur-sm" style={{ background: `${c.color}CC` }}>{c.category}</span>
                              {enr && <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-bold text-white bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-full"><Check className="w-3 h-3" /> Inscrit</span>}
                              <h3 className="absolute bottom-3 left-3 right-3 text-base font-bold text-white leading-snug drop-shadow">{c.title}</h3>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              {c.description && <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">{c.description}</p>}
                              <div className="flex flex-col gap-1.5 text-[11px] text-muted mb-3">
                                {c.instructor_name && <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" style={{ color: c.color }} /> {c.instructor_name}</span>}
                                <span className="flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" style={{ color: c.color }} /> {c.day} · {c.start_time}–{c.end_time}</span>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" style={{ color: c.color }} /> {c.sessions_count} séances</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface">{MODE_LABEL[c.mode]}</span>
                                </div>
                              </div>
                              {enr && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-[10px] text-muted mb-1"><span>Progression</span><span className="font-bold" style={{ color: c.color }}>{enr.progress}%</span></div>
                                  <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${enr.progress}%`, background: c.color }} /></div>
                                </div>
                              )}
                              <button onClick={() => startExtra(c)}
                                className="mt-auto w-full py-2.5 text-sm font-bold rounded-lg text-white hover:opacity-90 hover:shadow-md transition-all flex items-center justify-center gap-2" style={{ background: c.color }}>
                                {enr ? <><PlayCircle className="w-4 h-4" /> Continuer</> : <><PlayCircle className="w-4 h-4" /> Commencer</>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )
              ) : (
                certs.length === 0 ? (
                  <Empty icon={Award} title="Aucune certification disponible" sub="Les certifications professionnelles (AWS, Cisco, Google…) publiées par l'administration apparaîtront ici." />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-ink">Certifications professionnelles</h2>
                      <span className="text-xs text-muted">{certs.length} parcours</span>
                    </div>
                    <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                      {certs.map((c) => {
                        const enr = myCertMap.get(c.id);
                        const st = enr ? CERT_STATUS_META[enr.status] : null;
                        const img = CERT_IMG[c.provider] ?? CERT_IMG["CAMA"];
                        return (
                          <div key={c.id} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300">
                            <div className="relative h-36 overflow-hidden">
                              <img src={img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.badge_color}DD, #1E1B4BDD)` }} />
                              <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">{c.provider}</span>
                                  <span className="text-[10px] font-bold text-white/70">{c.level}</span>
                                  {enr && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto ${st?.cls}`}>{st?.label}</span>}
                                </div>
                                <div>
                                  <h3 className="text-base font-bold leading-snug drop-shadow">{c.title}</h3>
                                  <p className="text-[11px] text-white/70 mt-1 flex items-center gap-3 flex-wrap">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.duration_h}h</span>
                                    {c.exam_fee && <span>Examen : {c.exam_fee}</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              {c.description && <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-3">{c.description}</p>}
                              {enr && (
                                <div className="mb-3 space-y-2">
                                  <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${enr.progress}%`, background: c.badge_color }} /></div>
                                  {enr.score && <p className="text-[10px] text-muted flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Score : {enr.score}</p>}
                                </div>
                              )}
                              <div className="mt-auto flex gap-2">
                                <button onClick={() => startCert(c)}
                                  className="flex-1 py-2.5 text-sm font-bold rounded-lg text-white flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-md transition-all" style={{ background: c.badge_color }}>
                                  {enr ? <><TrendingUp className="w-4 h-4" /> Continuer</> : <><PlayCircle className="w-4 h-4" /> Commencer</>}
                                </button>
                                {enr && c.environment_url && (
                                  <a href={c.environment_url} target="_blank" rel="noopener noreferrer" title="Environnement de labs"
                                    className="px-3 py-2.5 rounded-lg border border-border text-ink hover:bg-surface transition-colors flex items-center"><Server className="w-4 h-4" /></a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )
              )}
            </div>

            {/* ── SIDEBAR DROITE ── */}
            <aside className="hidden lg:block space-y-3 lg:sticky lg:top-4">
              {/* Statistiques rapides */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cama" />
                  <p className="text-xs font-black uppercase tracking-widest text-ink">Statistiques</p>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="bg-surface rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-cama">{myExtra.filter(e => e.status === "termine").length}</p>
                    <p className="text-[9px] text-muted uppercase">Cours terminés</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-amber-500">{myExtra.filter(e => e.status === "en_cours").length}</p>
                    <p className="text-[9px] text-muted uppercase">En cours</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-emerald-500">{myCerts.filter(e => e.status === "obtenu").length}</p>
                    <p className="text-[9px] text-muted uppercase">Certifiés</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-violet-500">{Math.round((myExtra.reduce((s, e) => s + e.progress, 0) + myCerts.reduce((s, e) => s + e.progress, 0)) / Math.max(1, myExtra.length + myCerts.length))}%</p>
                    <p className="text-[9px] text-muted uppercase">Moy. progrès</p>
                  </div>
                </div>
              </div>

              {/* Populaires */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-ink">Populaires</p>
                </div>
                <div className="divide-y divide-border">
                  {(tab === "extra" ? extra : certs).slice(0, 5).map((item, i) => {
                    const isExtra = tab === "extra";
                    const color = isExtra ? (item as DBExtraCourse).color : (item as DBCertification).badge_color;
                    return (
                      <button key={item.id} onClick={() => isExtra ? startExtra(item as DBExtraCourse) : startCert(item as DBCertification)}
                        className="w-full px-3 py-2 hover:bg-surface transition-colors text-left flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: color }}>{i + 1}</span>
                        <p className="text-[11px] font-semibold text-ink truncate">{item.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Catégories rapides (certifications) */}
              {tab === "cert" && (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                    <Award className="w-4 h-4 text-cama" />
                    <p className="text-xs font-black uppercase tracking-widest text-ink">Providers</p>
                  </div>
                  <div className="p-2 flex flex-wrap gap-1.5">
                    {Array.from(new Set(certs.map(c => c.provider))).map(p => (
                      <span key={p} className="text-[10px] font-bold bg-surface text-ink px-2.5 py-1 rounded-full">{p} ({certs.filter(c => c.provider === p).length})</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Encart motivation */}
              <div className="rounded-xl p-3.5 text-white" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                <GraduationCap className="w-5 h-5 text-yellow-300 mb-1.5" />
                <p className="font-bold text-sm leading-snug mb-1">Boostez votre CV</p>
                <p className="text-white/70 text-[11px] leading-relaxed">Chaque certification obtenue renforce votre profil professionnel et ouvre de nouvelles opportunités.</p>
              </div>
            </aside>
          </div>
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
