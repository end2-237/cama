"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, GraduationCap, Mail, MapPin, ShieldCheck, Award,
  BookOpen, CheckCircle2, TrendingUp, QrCode, CalendarDays,
  CalendarClock, HelpCircle, MessagesSquare, Bot, FileText,
  Pencil, Globe, Wifi, Bell, Lock, ChevronRight, Building2,
  Clock, Radio, LayoutDashboard, Star, Zap, UserCheck, AlarmClock,
  BadgeCheck, BarChart2, Hash, Search, Library, Video, MonitorPlay,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import QrSvg from "@/components/QrSvg";
import PersonalCalendarDrawer from "@/components/PersonalCalendarDrawer";
import { fetchLibrary, teacherLibrary, type LibraryDoc, KIND_LABEL } from "@/lib/library";
import { fetchStudentProgram, fetchChapters, fetchProgress, fetchTeacherCourses } from "@/lib/program";
import { fetchAttemptsForStudent, fetchDeliberations, type DelibWithMeta } from "@/lib/exams";
import type { DBProgramCourse, DBChapter, DBExamAttempt } from "@/lib/supabase";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [calOpen, setCalOpen] = useState(false);
  const [dataSaver, setDataSaver] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);

  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [chaptersByCourse, setChaptersByCourse] = useState<Record<string, DBChapter[]>>({});
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);
  const [results, setResults] = useState<DelibWithMeta[]>([]);
  const [libDocs, setLibDocs] = useState<LibraryDoc[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const slug = user.dossier?.parcoursSlug;
    let cancelled = false;
    (async () => {
      const [progress, atts, delibs] = await Promise.all([
        fetchProgress(user.id),
        fetchAttemptsForStudent(user.id),
        fetchDeliberations(),
      ]);
      if (cancelled) return;
      setDoneIds(new Set(progress.map((p) => p.chapter_id)));
      setAttempts(atts);
      setResults(delibs.filter((d) => d.student_id === user.id));

      if (!slug) return;
      const progCourses = await fetchStudentProgram(slug, user.dossier?.level);
      if (cancelled) return;
      setCourses(progCourses);
      const chapterLists = await Promise.all(progCourses.map((c) => fetchChapters(c.id)));
      if (cancelled) return;
      const map: Record<string, DBChapter[]> = {};
      progCourses.forEach((c, i) => { map[c.id] = chapterLists[i]; });
      setChaptersByCourse(map);
    })();
    return () => { cancelled = true; };
  }, [user]);

  /* Miniature bibliothèque : docs pertinents selon le rôle */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const all = await fetchLibrary();
      if (cancelled) return;
      if (user.role === "enseignant") {
        const my = await fetchTeacherCourses(user.id);
        if (cancelled) return;
        setLibDocs(teacherLibrary(all, user.id, my.map((c) => c.id)).slice(0, 4));
      } else if (user.role === "etudiant") {
        const slug = user.dossier?.parcoursSlug;
        const lvl = user.dossier?.level;
        const mine = all.filter((d) =>
          (!slug || d.parcoursSlug === slug) && (!lvl || d.level === lvl));
        setLibDocs((mine.length ? mine : all).slice(0, 4));
      } else {
        setLibDocs(all.slice(0, 4));
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>;
  }

  /* Statistiques réelles depuis Supabase */
  const totalChapters = Object.values(chaptersByCourse).reduce((a, chs) => a + chs.length, 0);
  const pct = totalChapters ? Math.round((doneIds.size / totalChapters) * 100) : 0;
  const validated = results.filter((r) => r.status === "valide");
  const ects = validated.reduce((a, r) => a + r.credits, 0);
  const alerts = attempts.reduce((a, x) => a + x.alerts.length, 0);
  const qrCode = `CAMA-${user.id.toUpperCase()}-2025`;

  /* Dossier académique réel (table inscriptions) */
  const d = user.dossier;
  const parcoursSlug   = d?.parcoursSlug ?? "genie-logiciel";
  const filiereTitle   = d?.parcoursTitle ?? "Génie Logiciel";
  const filiereSchool  = d?.school ?? user.school ?? "École d'Informatique";
  const campus         = d?.campus ?? "Yaoundé";
  const modeLabel      = d?.modeLabel ?? "Hybride";
  const matricule      = user.studentCard || d?.matricule || "—";
  const academicYear   = d?.academicYear ?? "2025–2026";
  const semestre       = d?.semester ?? 1;
  const niveau         = d?.level || user.level || "L1";
  const cycleType      = d?.cycleType ?? "Licence";
  const totalEcts      = d?.totalEcts ?? 180;
  const enrolledLabel  = d?.enrolledAt
    ? new Date(d.enrolledAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "—";

  const QUICK_LINKS = [
    { icon: CalendarClock, label: "Mon planning", sub: "Programme hebdo selon votre mode", action: () => setCalOpen(true) },
    { icon: CalendarDays,  label: "Calendrier académique", sub: "Année 2025–2026", href: "/calendrier" },
    { icon: QrCode,        label: "Relevé certifié", sub: `${ects} ECTS · QR vérifiable`, href: "/diplome" },
    { icon: HelpCircle,    label: "Guide CAMA", sub: "Tout comprendre de la plateforme", href: "/guide" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">

          {/* Retour + logo */}
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Dashboard</span>
          </Link>
          <div className="w-px h-5 bg-border flex-shrink-0" />
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-1 h-6 bg-gradient-to-b from-cama to-gold" />
            <span className="text-sm font-bold text-ink tracking-tight">CA<span className="text-cama">MA</span></span>
          </Link>
          <span className="text-[10px] font-black uppercase tracking-widest text-subtle hidden md:block">Mon profil</span>

          {/* Recherche */}
          <div className="hidden md:flex flex-1 max-w-xs items-center gap-2 bg-surface px-3 py-1.5 border border-border focus-within:border-cama transition-colors ml-2">
            <Search className="w-3.5 h-3.5 text-subtle flex-shrink-0" />
            <input type="text" placeholder="Rechercher dans mon profil..."
              className="bg-transparent text-xs text-ink placeholder-subtle outline-none w-full" />
          </div>

          <div className="flex-1" />

          {/* Liens rapides */}
          <nav className="hidden lg:flex items-center gap-0.5 text-xs font-semibold">
            {[
              { label: "Mes cours",  href: "/dashboard" },
              { label: "Calendrier", href: "/calendrier" },
              { label: "Diplôme",    href: "/diplome" },
              { label: "Guide",      href: "/guide" },
            ].map((l) => (
              <Link key={l.label} href={l.href}
                className="px-3 py-1.5 text-muted hover:text-cama hover:bg-cama-50/40 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="w-px h-5 bg-border hidden lg:block" />

          {/* Icônes actions */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => setCalOpen(true)} title="Mon planning"
              className="p-1.5 text-muted hover:text-cama hover:bg-surface transition-colors">
              <CalendarClock className="w-4 h-4" />
            </button>
            <Link href="/calendrier" title="Calendrier académique"
              className="p-1.5 text-muted hover:text-cama hover:bg-surface transition-colors hidden sm:block">
              <CalendarDays className="w-4 h-4" />
            </Link>
            <button title="Notifications" className="relative p-1.5 text-muted hover:text-cama hover:bg-surface transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <Link href="/guide" title="Aide"
              className="p-1.5 text-muted hover:text-cama hover:bg-surface transition-colors hidden sm:block">
              <HelpCircle className="w-4 h-4" />
            </Link>
          </div>

          {/* Mini profil */}
          <div className="flex items-center gap-2 pl-2 border-l border-border flex-shrink-0">
            <div className={`w-7 h-7 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-[10px] font-bold`}>
              {user.initials}
            </div>
            <div className="hidden md:block leading-tight">
              <p className="text-xs font-bold text-ink leading-none">{user.firstName}</p>
              <p className="text-[9px] text-subtle leading-none mt-0.5">{user.level || user.roleLabel}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO PROFIL ── */}
      <section className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(120deg, #1E1B4B 0%, #312E81 55%, #4F46E5 100%)" }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 22px, #fff 22px, #fff 23px), repeating-linear-gradient(0deg, transparent, transparent 22px, #fff 22px, #fff 23px)",
        }} />
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-center gap-6">
          <div className="relative">
            <div className={`w-20 h-20 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-2xl font-bold border-4 border-white/20`}>
              {user.initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold flex items-center justify-center hover:bg-gold-dark transition-colors" title="Changer la photo">
              <Pencil className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <span className="text-[10px] font-black uppercase tracking-widest bg-gold text-white px-2 py-0.5">{niveau || user.roleLabel}</span>
              <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5">Mode {modeLabel.toLowerCase()}</span>
            </div>
            <p className="text-white/70 text-sm flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
              <span className="text-white/30">·</span>
              <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {cycleType} {filiereTitle}</span>
              <span className="text-white/30">·</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Campus {campus}</span>
            </p>
            <p className="text-white/50 text-xs mt-1">Matricule {matricule} · inscrit depuis {enrolledLabel} · semestre {semestre} en cours</p>
          </div>
          {/* Anneau progression */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-3xl font-black text-gold leading-none">{pct}%</p>
              <p className="text-[10px] text-white/60 mt-1">{doneIds.size}/{totalChapters} chapitres validés</p>
            </div>
            <div className="w-14 h-14">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F59E0B" strokeWidth="3"
                  strokeDasharray={`${pct} 100`} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto grid lg:grid-cols-[220px_1fr_300px] gap-0 items-start">

        {/* ══ SIDEBAR GAUCHE STICKY ══ */}
        <aside className="hidden lg:block bg-white border-r border-border lg:sticky lg:top-12 lg:h-[calc(100vh-48px)] lg:overflow-y-auto">

          {/* Nav sections */}
          <div className="px-3 py-4 border-b border-border">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Navigation</p>
            <div className="space-y-0.5">
              {[
                { icon: BarChart2,   label: "Progression",        href: "#stats" },
                { icon: GraduationCap, label: "Mon cursus",       href: "#cursus" },
                { icon: BookOpen,    label: "Mes cours",           href: "#cours" },
                { icon: Award,       label: "Résultats",           href: "#resultats" },
                { icon: ShieldCheck, label: "Intégrité",           href: "#integrite" },
              ].map((n) => (
                <a key={n.label} href={n.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-cama-50/40 hover:text-cama transition-colors group text-muted">
                  <n.icon className="w-3.5 h-3.5 flex-shrink-0 group-hover:text-cama" />
                  <span className="text-xs font-semibold">{n.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Niveau académique chain */}
          <div className="px-3 py-4 border-b border-border">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3">Progression L·M·D</p>
            <div className="space-y-2">
              {[
                { code: "L1", label: "Licence 1", done: true },
                { code: "L2", label: "Licence 2", active: true },
                { code: "L3", label: "Licence 3", done: false },
                { code: "M1", label: "Master 1",  done: false },
                { code: "M2", label: "Master 2",  done: false },
              ].map((lvl) => (
                <div key={lvl.code} className="flex items-center gap-2">
                  <div className={`w-7 h-7 flex items-center justify-center text-[9px] font-black flex-shrink-0 border ${
                    lvl.done   ? "bg-green-600 border-green-600 text-white" :
                    lvl.active ? "bg-cama border-cama text-white" :
                    "bg-white border-border text-subtle"
                  }`}>
                    {lvl.done ? <BadgeCheck className="w-3.5 h-3.5" /> : lvl.code}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-bold leading-none ${lvl.active ? "text-cama" : lvl.done ? "text-green-600" : "text-subtle"}`}>{lvl.label}</p>
                    <p className="text-[9px] text-subtle">{lvl.done ? "Validé" : lvl.active ? "En cours" : "À venir"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prochains événements */}
          <div className="px-3 py-4 border-b border-border">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3 flex items-center gap-1">
              <AlarmClock className="w-3 h-3" /> À venir
            </p>
            <div className="space-y-2">
              {[
                { date: "12 juin", label: "Examen Algo S4",       color: "bg-red-500" },
                { date: "14 juin", label: "TP Réseau — campus",   color: "bg-gold" },
                { date: "20 juin", label: "Délibérations S4",     color: "bg-purple-500" },
                { date: "5 juil.", label: "Cérémonie diplômes",   color: "bg-cama" },
              ].map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${e.color}`} />
                  <div>
                    <p className="text-[10px] font-bold text-ink leading-tight">{e.label}</p>
                    <p className="text-[9px] text-subtle">{e.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/calendrier" className="text-[9px] font-bold text-cama hover:underline mt-2 inline-flex items-center gap-0.5">
              Voir le calendrier <ChevronRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          {/* Confiance par la preuve */}
          <div className="px-3 py-4 border-b border-border">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3 flex items-center gap-1">
              <Star className="w-3 h-3 text-gold-dark" /> Confiance par la preuve
            </p>
            <div className="space-y-1.5">
              {[
                { label: "Identité vérifiée", ok: true },
                { label: "Email confirmé",    ok: true },
                { label: "Photo de profil",   ok: false },
                { label: "Relevé certifié",   ok: true },
                { label: "Mode hybride actif",ok: true },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 flex items-center justify-center flex-shrink-0 ${c.ok ? "text-green-600" : "text-border"}`}>
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className={`text-[10px] font-semibold ${c.ok ? "text-ink" : "text-subtle line-through"}`}>{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="px-3 py-4">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Raccourcis</p>
            <div className="space-y-0.5">
              {[
                { icon: LayoutDashboard, label: "Dashboard",       href: "/dashboard" },
                { icon: Zap,             label: "Cours en live",   href: "/live/demo" },
                { icon: UserCheck,       label: "Forum de classe", href: "#" },
                { icon: Hash,            label: "Réglages",        href: "#preferences" },
              ].map((r) => (
                <Link key={r.label} href={r.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-cama-50/40 hover:text-cama transition-colors group text-muted">
                  <r.icon className="w-3.5 h-3.5 flex-shrink-0 group-hover:text-cama" />
                  <span className="text-xs font-semibold">{r.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* ══ COLONNE PRINCIPALE ══ */}
        <div className="border-r border-border bg-white min-h-full">

          {/* Stats */}
          <div id="stats" className="grid grid-cols-4 divide-x divide-border border-b border-border">
            {[
              { icon: TrendingUp,   value: `${pct}%`, label: "Progression", color: "text-cama" },
              { icon: CheckCircle2, value: String(doneIds.size), label: "Chapitres validés", color: "text-green-600" },
              { icon: Award,        value: String(ects), label: "ECTS certifiés", color: "text-gold-dark" },
              { icon: ShieldCheck,  value: String(attempts.length), label: "Examens passés", color: "text-purple-600" },
            ].map((s) => (
              <div key={s.label} className="p-4 text-center">
                <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                <p className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Cursus */}
          <section id="cursus" className="px-5 py-4 border-b border-border">
            <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-cama" /> Mon cursus
            </h2>
            <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
              {[
                { k: "Filière", v: `${filiereTitle} — ${filiereSchool}` },
                { k: "Cycle", v: `${cycleType} (LMD) · ${niveau} · ${totalEcts} ECTS au total` },
                { k: "Mode d'inscription", v: modeLabel },
                { k: "Année académique", v: `${academicYear} · Semestre ${semestre}` },
              ].map((r) => (
                <div key={r.k} className="bg-white p-3">
                  <p className="text-[10px] text-subtle uppercase tracking-wider">{r.k}</p>
                  <p className="text-sm text-ink font-semibold mt-0.5">{r.v}</p>
                </div>
              ))}
            </div>
            <Link href={`/parcours/${parcoursSlug}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-cama hover:underline mt-2">
              Voir la fiche complète du parcours <ChevronRight className="w-3 h-3" />
            </Link>
          </section>

          {/* Mes cours */}
          <section id="cours" className="px-5 py-4 border-b border-border">
            <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cama" /> Mes cours en cours
            </h2>
            <div className="border border-border divide-y divide-border">
              {courses.map((c) => {
                const chs = chaptersByCourse[c.id] ?? [];
                const done = chs.filter((x) => doneIds.has(x.id)).length;
                const p = pct;
                return (
                  <Link key={c.id} href={`/cours/${c.id}`} className="flex items-center gap-3 p-3 hover:bg-cama-50/40 transition-colors group">
                    <div className="w-8 h-8 bg-cama-50 flex items-center justify-center flex-shrink-0 group-hover:bg-cama transition-colors">
                      <BookOpen className="w-3.5 h-3.5 text-cama group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink truncate group-hover:text-cama transition-colors">{c.title}</p>
                      <p className="text-[10px] text-subtle">{c.code} · {done}/{chs.length} chapitres</p>
                    </div>
                    <div className="w-20 h-1 bg-surface overflow-hidden flex-shrink-0">
                      <div className="h-full bg-gradient-to-r from-cama to-cama-400" style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-xs font-bold text-cama w-9 text-right flex-shrink-0">{p}%</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Résultats */}
          <section id="resultats" className="px-5 py-4 border-b border-border">
            <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-cama" /> Derniers résultats
            </h2>
            <div className="border border-border divide-y divide-border">
              {results.map((r) => {
                const note = r.note ?? 0;
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink truncate">{r.course?.title}</p>
                      <p className="text-[10px] text-subtle">{r.course?.code} · {r.credits} ECTS</p>
                    </div>
                    <span className={`text-sm font-bold ${note >= 10 ? "text-green-600" : "text-red-500"}`}>{note}/20</span>
                    {r.status === "valide"
                      ? <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600"><CheckCircle2 className="w-2.5 h-2.5" /> Jury</span>
                      : <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark"><Clock className="w-2.5 h-2.5" /> Délib.</span>}
                  </div>
                );
              })}
              {results.length === 0 && <p className="p-4 text-xs text-muted text-center">Aucun résultat publié.</p>}
            </div>
          </section>

          {/* Intégrité académique */}
          <section id="integrite" className="px-5 py-4">
            <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cama" /> Intégrité académique
            </h2>
            <div className={`border p-3 flex items-center gap-3 ${alerts === 0 ? "border-green-200 bg-green-50/50" : "border-gold/30 bg-gold/5"}`}>
              <ShieldCheck className={`w-6 h-6 flex-shrink-0 ${alerts === 0 ? "text-green-600" : "text-gold-dark"}`} />
              <div className="flex-1">
                <p className="text-xs font-bold text-ink">
                  {alerts === 0 ? "Dossier vierge — aucun signalement" : `${alerts} signalement(s) Safe-CAMA en examen — en attente de décision du jury`}
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  Politique human-in-the-loop : l&apos;IA signale, le jury décide. Vous disposez d&apos;un droit d&apos;appel pour toute décision.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ══ COLONNE DROITE ══ */}
        <div className="bg-white min-h-full">

          {/* Bibliothèque (miniature) */}
          <section className="px-4 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black text-ink uppercase tracking-widest flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5 text-cama" />
                {user.role === "enseignant" ? "Ma bibliothèque" : "Bibliothèque"}
              </h2>
              <Link href="/bibliotheque" className="text-[10px] font-bold text-cama hover:underline">Tout voir →</Link>
            </div>
            <div className="space-y-px bg-border border border-border">
              {libDocs.length === 0 && (
                <p className="bg-white text-xs text-muted p-3">Aucun document pour le moment.</p>
              )}
              {libDocs.map((d) => {
                const Icon = d.kind === "video" ? Video : d.kind === "natif" ? MonitorPlay : FileText;
                return (
                  <Link key={d.id} href="/bibliotheque"
                    className="bg-white flex items-center gap-2.5 p-2.5 hover:bg-cama-50/40 transition-colors group">
                    <div className="w-7 h-7 bg-cama-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-cama" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-ink truncate group-hover:text-cama transition-colors">{d.title}</p>
                      <p className="text-[9px] text-muted truncate">{KIND_LABEL[d.kind]} · {d.courseCode} · {d.authorName}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p className="text-[10px] text-subtle mt-2 leading-relaxed">
              {user.role === "enseignant"
                ? "Tous vos supports, y compris ceux des cours qui vous ont été retirés."
                : "Documents mis en avant pour votre cycle et votre niveau."}
            </p>
          </section>

          {/* Accès rapides aux composants existants */}
          <section className="px-4 py-4 border-b border-border">
            <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3">Accès rapides</h2>
            <div className="space-y-px bg-border border border-border">
              {QUICK_LINKS.map((l) => {
                const inner = (
                  <div className="bg-white flex items-center gap-3 p-3 hover:bg-cama-50/40 transition-colors group cursor-pointer">
                    <div className="w-8 h-8 bg-cama-50 flex items-center justify-center flex-shrink-0 group-hover:bg-cama transition-colors">
                      <l.icon className="w-4 h-4 text-cama group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink group-hover:text-cama transition-colors">{l.label}</p>
                      <p className="text-[10px] text-muted truncate">{l.sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-subtle group-hover:text-cama transition-colors" />
                  </div>
                );
                return l.href
                  ? <Link key={l.label} href={l.href}>{inner}</Link>
                  : <button key={l.label} onClick={l.action} className="w-full text-left">{inner}</button>;
              })}
            </div>
            <p className="text-[10px] text-subtle mt-2 leading-relaxed flex items-start gap-1.5">
              <MessagesSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
              Les discussions enseignants, le forum de classe et l&apos;assistant <Bot className="w-3 h-3 inline" /> restent accessibles via les boutons flottants du dashboard.
            </p>
          </section>

          {/* Relevé QR */}
          <section className="px-4 py-4 border-b border-border">
            <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3">Identité certifiée</h2>
            <div className="flex items-center gap-3">
              <div className="border-2 border-ink p-1 bg-white flex-shrink-0">
                <QrSvg data={qrCode} size={72} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-muted break-all">{qrCode}</p>
                <p className="text-[10px] text-muted mt-1 leading-relaxed">Code public de vérification de votre relevé — scannable par tout recruteur.</p>
                <Link href={`/verifier/${qrCode}`} className="text-[10px] font-bold text-cama hover:underline">Tester la vérification →</Link>
              </div>
            </div>
          </section>

          {/* Mode & campus */}
          <section className="px-4 py-4 border-b border-border">
            <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3">Mon mode {modeLabel.toLowerCase()}</h2>
            <div className="space-y-2">
              {[
                { icon: Building2, t: "Mardi & jeudi", d: "Présence campus — TD, TP, cours magistraux" },
                { icon: Radio,     t: "Lun / mer / ven", d: "Plateforme CAMA — lives, cours natifs, vidéos" },
                { icon: FileText,  t: "Règlement intérieur", d: "Applicable les jours de présence campus" },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <r.icon className="w-3.5 h-3.5 text-cama flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-ink">{r.t}</p>
                    <p className="text-[10px] text-muted">{r.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href={`/parcours/${parcoursSlug}/campus`} className="text-[10px] font-bold text-cama hover:underline mt-2 inline-block">
              Détails campus & règlement →
            </Link>
          </section>

          {/* Préférences */}
          <section id="preferences" className="px-4 py-4 border-b border-border">
            <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3">Préférences</h2>
            <div className="space-y-3">
              <Toggle icon={Wifi} label="Économie de données" sub="240p par défaut, images compressées" on={dataSaver} setOn={setDataSaver} />
              <Toggle icon={Bell} label="Notifications email" sub="Lives, résultats, communications admin" on={notifEmail} setOn={setNotifEmail} />
              <div className="flex items-center gap-2.5">
                <Globe className="w-3.5 h-3.5 text-cama flex-shrink-0" />
                <p className="text-xs font-bold text-ink flex-1">Langue</p>
                <select className="text-xs border border-border px-2 py-1 outline-none focus:border-cama bg-white">
                  <option>Français</option>
                  <option>English</option>
                </select>
              </div>
            </div>
          </section>

          {/* Sécurité */}
          <section className="px-4 py-4">
            <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3">Sécurité</h2>
            <button className="w-full flex items-center gap-2.5 border border-border p-2.5 hover:border-cama/40 hover:bg-surface transition-all text-left">
              <Lock className="w-3.5 h-3.5 text-muted" />
              <span className="text-xs font-bold text-ink flex-1">Changer mon mot de passe</span>
              <ChevronRight className="w-3.5 h-3.5 text-subtle" />
            </button>
            <p className="text-[9px] text-subtle mt-2">Dernière connexion : aujourd&apos;hui · Yaoundé, Cameroun</p>
          </section>
        </div>
      </main>

      <PersonalCalendarDrawer open={calOpen} onClose={() => setCalOpen(false)} />
    </div>
  );
}

function Toggle({ icon: Icon, label, sub, on, setOn }: {
  icon: typeof Wifi; label: string; sub: string; on: boolean; setOn: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-3.5 h-3.5 text-cama flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-ink">{label}</p>
        <p className="text-[10px] text-muted truncate">{sub}</p>
      </div>
      <button onClick={() => setOn(!on)}
        className={`w-9 h-5 flex items-center px-0.5 transition-colors flex-shrink-0 ${on ? "bg-cama justify-end" : "bg-border justify-start"}`}>
        <span className="w-4 h-4 bg-white shadow" />
      </button>
    </div>
  );
}
