"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Library, Search, Filter, FileText, Video, MonitorPlay,
  BookMarked, ExternalLink, ShieldCheck, Sparkles, Clock, BarChart3, Info,
  RotateCcw, ChevronRight, User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchLibrary, teacherLibrary, KIND_LABEL, docCover, type LibraryDoc, type LibraryKind } from "@/lib/library";
import { fetchTeacherCourses } from "@/lib/program";

const ALL_KINDS = Object.keys(KIND_LABEL) as LibraryKind[];
const LEVELS = ["L1", "L2", "L3", "M1", "M2"];
const SEMESTRES = ["S1", "S2", "S3", "S4", "S5", "S6"];
const PAGE_SIZE = 30;

function KindIcon({ kind, className }: { kind: LibraryKind; className?: string }) {
  const cls = className ?? "w-4 h-4";
  switch (kind) {
    case "pdf": return <FileText className={cls} />;
    case "video": return <Video className={cls} />;
    case "natif": return <MonitorPlay className={cls} />;
    case "lien": return <ExternalLink className={cls} />;
    case "epreuve": return <ShieldCheck className={cls} />;
    default: return <BookMarked className={cls} />; // syllabus / support / biblio
  }
}

export default function BibliothequePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [allDocs, setAllDocs] = useState<LibraryDoc[]>([]);
  const [myCourseIds, setMyCourseIds] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [kinds, setKinds] = useState<Set<LibraryKind>>(new Set());
  const [filiere, setFiliere] = useState("");
  const [niveau, setNiveau] = useState("");
  const [semestre, setSemestre] = useState("");
  const [annee, setAnnee] = useState("");
  const [authorQ, setAuthorQ] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "ancien">("recent");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [docs, courses] = await Promise.all([
        fetchLibrary(),
        user.role === "enseignant" ? fetchTeacherCourses(user.id) : Promise.resolve([]),
      ]);
      setAllDocs(docs);
      setMyCourseIds(courses.map((c) => c.id));
      setFetching(false);
    })();
  }, [user]);

  const isTeacher = user?.role === "enseignant";
  const isStudent = user?.role === "etudiant";

  // ── Base scope (before user filters) ──
  const scoped = useMemo(() => {
    if (!user) return [];
    if (isTeacher) return teacherLibrary(allDocs, user.id, myCourseIds);
    return allDocs;
  }, [allDocs, user, isTeacher, myCourseIds]);

  const myCourseSet = useMemo(() => new Set(myCourseIds), [myCourseIds]);

  // ── Filter options ──
  const filieres = useMemo(() => Array.from(new Set(scoped.map((d) => d.parcoursTitle))).sort(), [scoped]);
  const annees = useMemo(
    () => Array.from(new Set(scoped.map((d) => d.academicYear).filter((y): y is string => !!y))).sort().reverse(),
    [scoped]
  );
  const kindCounts = useMemo(() => {
    const m = {} as Record<LibraryKind, number>;
    ALL_KINDS.forEach((k) => { m[k] = 0; });
    scoped.forEach((d) => { m[d.kind] = (m[d.kind] ?? 0) + 1; });
    return m;
  }, [scoped]);

  // ── Filtered docs ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const aq = authorQ.trim().toLowerCase();
    const out = scoped.filter((d) => {
      if (q && !(`${d.title} ${d.courseCode} ${d.courseTitle} ${d.authorName}`.toLowerCase().includes(q))) return false;
      if (kinds.size > 0 && !kinds.has(d.kind)) return false;
      if (filiere && d.parcoursTitle !== filiere) return false;
      if (niveau && d.level !== niveau) return false;
      if (semestre && d.semestre !== semestre) return false;
      if (annee && d.academicYear !== annee) return false;
      if (aq && !d.authorName.toLowerCase().includes(aq)) return false;
      return true;
    });
    out.sort((a, b) => sortOrder === "recent"
      ? (b.date ?? "").localeCompare(a.date ?? "")
      : (a.date ?? "").localeCompare(b.date ?? ""));
    return out;
  }, [scoped, search, kinds, filiere, niveau, semestre, annee, authorQ, sortOrder]);

  const activeFilterCount =
    (search.trim() ? 1 : 0) + kinds.size + (filiere ? 1 : 0) + (niveau ? 1 : 0) +
    (semestre ? 1 : 0) + (annee ? 1 : 0) + (authorQ.trim() ? 1 : 0);

  const resetFilters = () => {
    setSearch(""); setKinds(new Set()); setFiliere(""); setNiveau("");
    setSemestre(""); setAnnee(""); setAuthorQ(""); setSortOrder("recent");
    setVisible(PAGE_SIZE);
  };

  const toggleKind = (k: LibraryKind) => {
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
    setVisible(PAGE_SIZE);
  };

  // ── Student recommendations ──
  const recommended = useMemo(() => {
    if (!isStudent || !user?.dossier) return [];
    const { level, parcoursSlug, academicYear } = user.dossier;
    return filtered.filter((d) =>
      d.level === level && d.parcoursSlug === parcoursSlug &&
      (!academicYear || !d.academicYear || d.academicYear === academicYear)
    );
  }, [filtered, isStudent, user]);

  // ── KPIs & right sidebar data ──
  const kpi = useMemo(() => ({
    total: scoped.length,
    pdf: scoped.filter((d) => d.kind === "pdf").length,
    video: scoped.filter((d) => d.kind === "video").length,
    epreuve: scoped.filter((d) => d.kind === "epreuve").length,
  }), [scoped]);

  const recent = useMemo(
    () => [...scoped].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, 5),
    [scoped]
  );

  const filiereStats = useMemo(() => {
    const m = new Map<string, number>();
    scoped.forEach((d) => m.set(d.parcoursTitle, (m.get(d.parcoursTitle) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [scoped]);
  const maxFiliere = Math.max(...filiereStats.map(([, n]) => n), 1);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  // ── Doc row ──
  const DocRow = ({ d }: { d: LibraryDoc }) => {
    const archived = isTeacher && user && d.authorId === user.id && !myCourseSet.has(d.courseId);
    return (
      <div className="px-4 py-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={docCover(d)} alt="" loading="lazy" className="w-24 h-16 object-cover flex-shrink-0 bg-cama-50" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-bold text-ink truncate">{d.title}</p>
            <span className="text-[8px] font-black uppercase tracking-widest text-muted bg-surface border border-border px-1.5 py-0.5 flex-shrink-0">
              {KIND_LABEL[d.kind]}
            </span>
            {archived && (
              <span className="text-[8px] font-black uppercase tracking-widest text-gold-dark bg-gold/10 px-1.5 py-0.5 flex-shrink-0">
                Cours retiré — archive personnelle
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5 flex-wrap">
            <span className="font-bold text-cama">{d.courseCode}</span>
            <span className="truncate">{d.courseTitle}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[9px] text-subtle flex-wrap">
            <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {d.authorName}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(d.date)}</span>
            <span>{d.level} · {d.semestre} · {d.parcoursTitle}</span>
            {d.academicYear && <span>{d.academicYear}</span>}
            {d.sizeMo !== null && <span>{d.sizeMo} Mo</span>}
          </div>
        </div>
        <div className="flex-shrink-0">
          {d.url ? (
            <a href={d.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-black bg-cama text-white px-3 py-1.5 hover:bg-cama-700 transition-colors uppercase tracking-wider">
              <ExternalLink className="w-3 h-3" /> Ouvrir
            </a>
          ) : (
            <Link href={`/cours/${d.courseId}`}
              className="text-[9px] font-bold text-gold-dark bg-gold/10 px-2 py-1 hover:underline inline-flex items-center gap-1">
              <BookMarked className="w-3 h-3" /> Consultable dans le cours
            </Link>
          )}
        </div>
      </div>
    );
  };

  // ── Loading ──
  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-8 h-8 border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const pageTitle = isTeacher ? "Ma Bibliothèque" : "Bibliothèque générale";
  const shown = filtered.slice(0, visible);

  return (
    <div className="min-h-screen bg-surface">
      {/* Top header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-[11px] text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-[11px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
            <Library className="w-3.5 h-3.5 text-cama" /> {pageTitle}
          </span>
          <span className="ml-auto text-[9px] text-muted">{filtered.length} document{filtered.length > 1 ? "s" : ""}</span>
        </div>
      </header>

      {fetching ? (
        <div className="py-32 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
      ) : (
        <div className="max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[280px_1fr_250px] gap-4 items-start">
          {/* ═══════════════ LEFT SIDEBAR — FILTRES ═══════════════ */}
          <aside className="space-y-3 lg:sticky lg:top-16 self-start">
            <div className="bg-white border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filtres
                </p>
                {activeFilterCount > 0 && (
                  <span className="text-[9px] font-bold text-white bg-cama px-1.5 py-0.5">{activeFilterCount} actif{activeFilterCount > 1 ? "s" : ""}</span>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-muted absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
                  placeholder="Titre, matière, auteur…"
                  className="w-full text-[11px] pl-7 pr-2 py-2 border border-border bg-surface text-ink placeholder:text-subtle focus:outline-none focus:border-cama"
                />
              </div>

              {/* Kinds */}
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1.5">Type de document</p>
              <div className="space-y-0.5 mb-3">
                {ALL_KINDS.map((k) => (
                  <label key={k} className="flex items-center gap-2 py-1 px-1.5 cursor-pointer hover:bg-cama-50 transition-colors">
                    <input type="checkbox" checked={kinds.has(k)} onChange={() => toggleKind(k)}
                      className="w-3 h-3 accent-[#4F46E5]" />
                    <span className="text-[10px] text-ink flex items-center gap-1.5 flex-1">
                      <KindIcon kind={k} className="w-3 h-3 text-muted" /> {KIND_LABEL[k]}
                    </span>
                    <span className="text-[9px] font-bold text-cama bg-cama-50 px-1.5 py-0.5">{kindCounts[k] ?? 0}</span>
                  </label>
                ))}
              </div>

              {/* Filière */}
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Filière</p>
              <select value={filiere} onChange={(e) => { setFiliere(e.target.value); setVisible(PAGE_SIZE); }}
                className="w-full text-[10px] px-2 py-1.5 border border-border bg-surface text-ink mb-3 focus:outline-none focus:border-cama">
                <option value="">Toutes les filières</option>
                {filieres.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              {/* Niveau / Semestre */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Niveau</p>
                  <select value={niveau} onChange={(e) => { setNiveau(e.target.value); setVisible(PAGE_SIZE); }}
                    className="w-full text-[10px] px-2 py-1.5 border border-border bg-surface text-ink focus:outline-none focus:border-cama">
                    <option value="">Tous</option>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Semestre</p>
                  <select value={semestre} onChange={(e) => { setSemestre(e.target.value); setVisible(PAGE_SIZE); }}
                    className="w-full text-[10px] px-2 py-1.5 border border-border bg-surface text-ink focus:outline-none focus:border-cama">
                    <option value="">Tous</option>
                    {SEMESTRES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Année académique */}
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Année académique</p>
              <select value={annee} onChange={(e) => { setAnnee(e.target.value); setVisible(PAGE_SIZE); }}
                className="w-full text-[10px] px-2 py-1.5 border border-border bg-surface text-ink mb-3 focus:outline-none focus:border-cama">
                <option value="">Toutes les années</option>
                {annees.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* Auteur */}
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Auteur</p>
              <input
                value={authorQ}
                onChange={(e) => { setAuthorQ(e.target.value); setVisible(PAGE_SIZE); }}
                placeholder="Nom de l'enseignant…"
                className="w-full text-[10px] px-2 py-1.5 border border-border bg-surface text-ink placeholder:text-subtle mb-3 focus:outline-none focus:border-cama"
              />

              {/* Tri */}
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Tri par date</p>
              <div className="grid grid-cols-2 gap-1 mb-3">
                {([["recent", "Plus récent"], ["ancien", "Plus ancien"]] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setSortOrder(key)}
                    className={`text-[10px] px-2 py-1.5 border transition-colors ${sortOrder === key ? "bg-cama text-white border-cama font-bold" : "bg-surface border-border text-ink hover:bg-cama-50"}`}>
                    {label}
                  </button>
                ))}
              </div>

              <button onClick={resetFilters}
                className="w-full flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-ink border border-border bg-surface px-2 py-2 hover:bg-cama-50 transition-colors">
                <RotateCcw className="w-3 h-3" /> Réinitialiser les filtres
              </button>
            </div>

            {/* Quick links */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Accès rapide</p>
              <div className="space-y-1">
                <Link href="/dashboard" className="flex items-center gap-2 text-[10px] text-cama hover:underline py-1">
                  <ChevronRight className="w-3 h-3" /> Tableau de bord
                </Link>
                {isStudent && (
                  <Link href="/etudiant/programme" className="flex items-center gap-2 text-[10px] text-cama hover:underline py-1">
                    <ChevronRight className="w-3 h-3" /> Mon programme
                  </Link>
                )}
              </div>
            </div>
          </aside>

          {/* ═══════════════ MAIN CONTENT ═══════════════ */}
          <main className="min-w-0 space-y-4">
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-cama-50 flex items-center justify-center"><Library className="w-3.5 h-3.5 text-cama" /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">Documents</p>
                </div>
                <p className="text-[22px] font-black text-ink">{kpi.total}</p>
                <p className="text-[9px] text-muted">au total</p>
              </div>
              <div className="bg-white border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-cama-50 flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-cama" /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">PDF</p>
                </div>
                <p className="text-[22px] font-black text-cama">{kpi.pdf}</p>
                <p className="text-[9px] text-muted">PDF de cours</p>
              </div>
              <div className="bg-white border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-cama-50 flex items-center justify-center"><Video className="w-3.5 h-3.5 text-cama" /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">Vidéos</p>
                </div>
                <p className="text-[22px] font-black text-ink">{kpi.video}</p>
                <p className="text-[9px] text-muted">capsules vidéo</p>
              </div>
              <div className="bg-white border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-gold/10 flex items-center justify-center"><ShieldCheck className="w-3.5 h-3.5 text-gold-dark" /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">Épreuves</p>
                </div>
                <p className="text-[22px] font-black text-gold-dark">{kpi.epreuve}</p>
                <p className="text-[9px] text-muted">annales & examens</p>
              </div>
            </div>

            {/* ── Recommandés (étudiants) ── */}
            {isStudent && user.dossier && recommended.length > 0 && (
              <section className="bg-cama-50 border border-cama/20">
                <div className="px-4 py-3 border-b border-cama/20 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cama flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Recommandés pour vous — {user.dossier.level} · {user.dossier.parcoursTitle}
                  </p>
                  <span className="text-[9px] font-bold text-white bg-cama px-2 py-0.5">{recommended.length}</span>
                </div>
                <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {recommended.slice(0, 9).map((d) => (
                    <div key={`rec-${d.id}`} className="bg-white border border-border flex flex-col">
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={docCover(d)} alt="" loading="lazy" className="h-28 object-cover w-full" />
                        <span className="absolute top-0 left-0 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white bg-cama px-1.5 py-0.5">
                          <KindIcon kind={d.kind} className="w-2.5 h-2.5" /> {KIND_LABEL[d.kind]}
                        </span>
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col">
                        <p className="text-[11px] font-bold text-ink line-clamp-2">{d.title}</p>
                        <p className="text-[10px] font-bold text-cama mt-0.5">{d.courseCode}</p>
                        <p className="text-[9px] text-subtle mt-auto pt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1"><UserIcon className="w-2.5 h-2.5" /> {d.authorName}</span>
                          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {formatDate(d.date)}</span>
                        </p>
                        <div className="mt-2">
                          {d.url ? (
                            <a href={d.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] font-black bg-cama text-white px-2 py-1 hover:bg-cama-700 transition-colors uppercase tracking-wider">
                              <ExternalLink className="w-2.5 h-2.5" /> Ouvrir
                            </a>
                          ) : (
                            <Link href={`/cours/${d.courseId}`}
                              className="inline-flex items-center gap-1 text-[9px] font-bold text-gold-dark bg-gold/10 px-2 py-1 hover:underline">
                              <BookMarked className="w-2.5 h-2.5" /> Dans le cours
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Tous les documents ── */}
            <section className="bg-white border border-border">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
                  <BookMarked className="w-3 h-3 text-muted" /> Tous les documents
                </p>
                <span className="text-[9px] text-muted">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
              </div>
              {filtered.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Library className="w-6 h-6 text-muted mx-auto mb-2" />
                  <p className="text-[11px] font-bold text-ink">Aucun document ne correspond</p>
                  <p className="text-[10px] text-muted">Modifiez ou réinitialisez vos filtres pour élargir la recherche.</p>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="mt-3 text-[10px] font-black uppercase tracking-wider text-cama hover:underline">
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border">
                    {shown.map((d) => <DocRow key={d.id} d={d} />)}
                  </div>
                  {filtered.length > visible && (
                    <div className="px-4 py-3 border-t border-border text-center">
                      <button onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className="text-[10px] font-black uppercase tracking-wider text-white bg-ink px-4 py-2 hover:bg-cama transition-colors">
                        Afficher plus ({filtered.length - visible} restant{filtered.length - visible > 1 ? "s" : ""})
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </main>

          {/* ═══════════════ RIGHT SIDEBAR ═══════════════ */}
          <aside className="space-y-3 lg:sticky lg:top-16 self-start hidden lg:block">
            {/* Récemment ajoutés */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Récemment ajoutés
              </p>
              <div className="space-y-1.5">
                {recent.map((d) => (
                  <div key={`recent-${d.id}`} className="flex items-start gap-2 py-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={docCover(d)} alt="" loading="lazy" className="w-10 h-10 object-cover flex-shrink-0 bg-cama-50" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-ink truncate">{d.title}</p>
                      <p className="text-[9px] text-muted">{d.courseCode} — {formatDate(d.date)}</p>
                    </div>
                  </div>
                ))}
                {recent.length === 0 && <p className="text-[10px] text-muted italic">Aucun document</p>}
              </div>
            </div>

            {/* Stats par filière */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> Par filière
              </p>
              <div className="space-y-2">
                {filiereStats.map(([f, n]) => (
                  <div key={f}>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[9px] text-ink truncate pr-2">{f}</p>
                      <p className="text-[9px] font-bold text-cama flex-shrink-0">{n}</p>
                    </div>
                    <div className="h-1.5 bg-surface border border-border">
                      <div className="h-full bg-cama" style={{ width: `${(n / maxFiliere) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {filiereStats.length === 0 && <p className="text-[10px] text-muted italic">Aucune donnée</p>}
              </div>
            </div>

            {/* Gradient info panel */}
            <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gold" />
                <p className="text-[9px] font-black uppercase tracking-widest">À propos de la bibliothèque</p>
              </div>
              <p className="text-[10px] leading-relaxed text-white/90">
                La bibliothèque CAMA centralise tous les supports pédagogiques de la plateforme :
                PDF de cours, vidéos, cours natifs, syllabus, bibliographies et annales d&apos;épreuves.
                Chaque document est rattaché à sa filière, son niveau et son enseignant auteur.
              </p>
              <p className="text-[9px] text-white/70 mt-2">
                {isTeacher
                  ? "Vos documents restent tracés à votre nom, même si un cours vous est retiré."
                  : "Utilisez les filtres pour trouver rapidement les ressources de votre parcours."}
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
