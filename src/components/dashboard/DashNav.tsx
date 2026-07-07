"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Grid3x3, Search, ChevronDown, Globe, HelpCircle,
  Bell, LogOut, User, Settings, Megaphone, X, FileText,
  CalendarDays, CalendarClock, Sparkles, Award, ClipboardList, BookOpen, ShieldCheck, Newspaper,
  Library, BarChart2, GraduationCap, MessagesSquare, Users, Wallet, Menu, LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PersonalCalendarDrawer from "@/components/PersonalCalendarDrawer";
import {
  fetchNotifs, markRead, markAllRead, subscribeNotifs, timeAgo,
  type DBNotification,
} from "@/lib/notifications";

interface DashNavProps {
  activeTab: string;
  onTab:     (t: string) => void;
  tabs:      string[];
}

export default function DashNav({ activeTab, onTab, tabs }: DashNavProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Notifications réelles (cloche) ──
  const [notifs, setNotifs] = useState<DBNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userId = user?.id;
  const unread = notifs.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetchNotifs(userId).then((rows) => { if (alive) setNotifs(rows); });
    const unsub = subscribeNotifs(userId, (n) => {
      if (alive) setNotifs((prev) => [n, ...prev.filter((p) => p.id !== n.id)]);
    });
    return () => { alive = false; unsub(); };
  }, [userId]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  // Fermer le méga-menu « Plus » au clic extérieur
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  const handleNotifClick = (n: DBNotification) => {
    if (!n.read_at) {
      markRead(n.id);
      setNotifs((prev) => prev.map((p) => p.id === n.id ? { ...p, read_at: new Date().toISOString() } : p));
    }
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  };

  const handleMarkAll = () => {
    if (!userId) return;
    markAllRead(userId);
    setNotifs((prev) => prev.map((p) => p.read_at ? p : { ...p, read_at: new Date().toISOString() }));
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (!user) return null;

  // Liens du menu mobile selon le rôle (réutilise les mêmes destinations que la nav desktop)
  const mobileLinks: { href: string; icon: typeof BookOpen; label: string }[] =
    user.role === "admin" ? [
      { href: "/admin/programme",    icon: BookOpen,      label: "Programme" },
      { href: "/admin/utilisateurs", icon: Users,         label: "Utilisateurs" },
      { href: "/admin/statistiques", icon: BarChart2,     label: "Statistiques" },
      { href: "/admin/suivi",        icon: BarChart2,     label: "Suivi & Qualité" },
      { href: "/admin/audit",        icon: ShieldCheck,   label: "Rapports & Audit" },
      { href: "/admin/finance",      icon: Wallet,        label: "Finances" },
      { href: "/admin/annees",       icon: ClipboardList, label: "Années & semestres" },
      { href: "/admin/salles",       icon: CalendarClock, label: "Salles & créneaux" },
      { href: "/presences",          icon: ClipboardList, label: "Présences" },
      { href: "/admin/promotions",   icon: Users,         label: "Promotions" },
      { href: "/jury/deliberations", icon: Award,         label: "Délibérations" },
      { href: "/jury/sessions",      icon: ShieldCheck,   label: "Sessions de jury" },
      { href: "/admin/enseignants",  icon: GraduationCap, label: "Enseignants" },
      { href: "/admin/roles",        icon: ShieldCheck,   label: "Niveaux d'admin" },
      { href: "/admin/media",        icon: FileText,      label: "Ressources média" },
      { href: "/admin/journal",      icon: Newspaper,     label: "Journal JFN" },
      { href: "/admin/hors-cursus",  icon: Sparkles,      label: "Hors-cursus" },
      { href: "/admin/certifications", icon: Award,       label: "Certifications" },
      { href: "/messagerie",         icon: Megaphone,     label: "Messagerie" },
    ] : user.role === "enseignant" ? [
      { href: "/enseignant/cours", icon: BookOpen,      label: "Mes matières" },
      { href: "/enseignant/examens", icon: BookOpen,    label: "Évaluations" },
      { href: "/bibliotheque",     icon: Library,       label: "Ma bibliothèque" },
      { href: "/presences",        icon: ClipboardList, label: "Présences" },
      { href: "/messagerie",       icon: Megaphone,     label: "Messagerie" },
    ] : user.role === "jury" ? [
      { href: "/jury/deliberations", icon: Award,       label: "Délibérations" },
      { href: "/jury/sessions",      icon: ShieldCheck, label: "Sessions de jury" },
      { href: "/messagerie",         icon: Megaphone,   label: "Messagerie" },
    ] : [
      { href: "/etudiant/programme",  icon: BookOpen,       label: "Mon programme" },
      { href: "/etudiant/examens",    icon: BookOpen,       label: "Examens" },
      { href: "/tp",                  icon: ClipboardList,  label: "TP & Machines" },
      { href: "/bibliotheque",        icon: Library,        label: "Bibliothèque" },
      { href: "/etudiant/parascolaire", icon: Sparkles,     label: "Parascolaire" },
      { href: "/etudiant/dossier",    icon: ClipboardList,  label: "Mon dossier" },
      { href: "/etudiant/bulletins",  icon: FileText,       label: "Mes bulletins" },
      { href: "/etudiant/finance",    icon: Wallet,         label: "Ma scolarité" },
      { href: "/messagerie",          icon: Megaphone,      label: "Messagerie" },
      { href: "/forum",               icon: MessagesSquare, label: "Forum & Communauté" },
    ];

  return (
    <>
    <header className="fixed top-[48px] inset-x-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-2">

          {/* Hamburger — mobile uniquement */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-1 text-ink hover:bg-surface rounded-lg transition-colors"
            aria-label="Ouvrir le menu">
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 mr-2 flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-cama to-gold" />
            <div className="leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted">Institut JFN</span>
              <span className="block text-lg font-bold leading-none text-ink tracking-tight">
                CA<span className="text-cama">MA</span>
              </span>
            </div>
          </Link>

          {/* Explore — icône, texte au survol */}
          <button className="hidden xl:flex items-center gap-0 border border-ink/25 rounded-full px-2.5 py-2 text-[13px] font-medium text-ink hover:bg-surface hover:border-cama/40 transition-all active:scale-95 group/exp"
            title="Explorer">
            <Grid3x3 className="w-4 h-4 flex-shrink-0" />
            <span className="max-w-0 opacity-0 group-hover/exp:max-w-[80px] group-hover/exp:opacity-100 group-hover/exp:ml-1.5 overflow-hidden whitespace-nowrap transition-all duration-300">Explorer</span>
            <ChevronDown className="w-3 h-3 max-w-0 opacity-0 group-hover/exp:max-w-[16px] group-hover/exp:opacity-100 group-hover/exp:ml-1 transition-all duration-300" />
          </button>

          {/* CAMA Search — compacte, se déploie au survol */}
          <button
            onClick={() => router.push("/recherche")}
            className="hidden md:flex items-center bg-surface rounded-full px-2.5 py-2 border border-border hover:border-cama/50 hover:shadow-sm transition-all duration-300 group/sch text-left max-w-[40px] hover:max-w-[260px] overflow-hidden"
            title="Ouvrir CAMA Search (recherche globale)">
            <Search className="w-4 h-4 text-cama flex-shrink-0" />
            <span className="text-[13px] text-subtle whitespace-nowrap opacity-0 group-hover/sch:opacity-100 ml-2.5 transition-opacity duration-300">
              Rechercher sur <span className="font-bold text-ink">CA<span className="text-cama">MA</span></span>…
            </span>
          </button>

          <div className="flex-1 min-w-0" />

          {/* Tabs */}
          <nav className="hidden md:flex items-center h-16">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => onTab(t)}
                className={`px-3 h-full text-[13px] font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === t
                    ? "border-cama text-cama"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
            {/* Admin: Programme + Utilisateurs inline, rest in "Plus" dropdown */}
            {user.role === "admin" && (
              <>
                <Link href="/admin/programme"
                  className="px-3 h-16 flex items-center text-[13px] font-semibold border-b-2 border-transparent text-muted hover:text-cama transition-all duration-200 whitespace-nowrap">
                  Programme
                </Link>
                <Link href="/admin/utilisateurs"
                  className="px-3 h-16 flex items-center text-[13px] font-semibold border-b-2 border-transparent text-muted hover:text-cama transition-all duration-200 whitespace-nowrap">
                  Utilisateurs
                </Link>
                <div className="relative" ref={moreRef}>
                  <button onClick={() => setMoreOpen(!moreOpen)}
                    className={`px-3 h-16 flex items-center gap-1 text-[13px] font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      moreOpen ? "border-cama text-cama" : "border-transparent text-muted hover:text-ink"}`}>
                    Plus <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                  </button>
                  {moreOpen && (
                    <div className="absolute right-0 top-full mt-0 w-[620px] bg-white border border-border shadow-2xl z-50 animate-scale-in">
                      {/* Filet dégradé signature */}
                      <div className="h-0.5 w-full bg-gradient-to-r from-cama via-cama-400 to-gold" />
                      <div className="grid grid-cols-3 gap-x-5 gap-y-5 p-5">
                        {[
                          { cat: "Pilotage", items: [
                            { href: "/admin/statistiques", icon: BarChart2,   label: "Statistiques",     sub: "Vue d'ensemble" },
                            { href: "/admin/suivi",        icon: BarChart2,   label: "Suivi & Qualité",  sub: "Progression" },
                            { href: "/admin/audit",        icon: ShieldCheck, label: "Rapports & Audit", sub: "Journal & exports" },
                            { href: "/admin/finance",      icon: Wallet,      label: "Finances",         sub: "Scolarité & reçus" },
                          ]},
                          { cat: "Académique", items: [
                            { href: "/admin/annees",  icon: ClipboardList, label: "Années & semestres", sub: "Structure" },
                            { href: "/admin/salles",  icon: CalendarClock, label: "Salles & créneaux",  sub: "Réservations" },
                            { href: "/presences",     icon: ClipboardList, label: "Présences",          sub: "Assiduité" },
                            { href: "/admin/promotions", icon: Users,       label: "Promotions",        sub: "Cohortes" },
                          ]},
                          { cat: "Scolarité & Jury", items: [
                            { href: "/jury/deliberations", icon: Award,       label: "Délibérations",    sub: "Par cours" },
                            { href: "/jury/sessions",      icon: ShieldCheck, label: "Sessions de jury", sub: "PV & décisions" },
                          ]},
                          { cat: "Personnels & accès", items: [
                            { href: "/admin/enseignants", icon: GraduationCap, label: "Enseignants",     sub: "Comptes profs" },
                            { href: "/admin/roles",       icon: ShieldCheck,   label: "Niveaux d'admin", sub: "Permissions" },
                          ]},
                          { cat: "Contenus", items: [
                            { href: "/admin/media",         icon: FileText, label: "Ressources média", sub: "Bibliothèque" },
                            { href: "/admin/journal",       icon: Newspaper, label: "Journal JFN",     sub: "Actualités" },
                            { href: "/admin/hors-cursus",   icon: Sparkles, label: "Hors-cursus",      sub: "Ateliers" },
                            { href: "/admin/certifications", icon: Award,   label: "Certifications",   sub: "Parcours certifiants" },
                          ]},
                          { cat: "Communication", items: [
                            { href: "/messagerie", icon: Megaphone, label: "Messagerie", sub: "Interne" },
                          ]},
                        ].map((group) => (
                          <div key={group.cat}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 pb-1.5 border-b border-border">
                              {group.cat}
                            </p>
                            <div className="space-y-0.5">
                              {group.items.map((l) => (
                                <Link key={l.href} href={l.href} onClick={() => setMoreOpen(false)}
                                  className="flex items-start gap-2.5 p-2 hover:bg-surface transition-colors group/mi border border-transparent hover:border-border">
                                  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-cama-50 group-hover/mi:bg-cama transition-colors">
                                    <l.icon className="w-3.5 h-3.5 text-cama group-hover/mi:text-white transition-colors" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[12px] font-bold text-ink leading-tight group-hover/mi:text-cama transition-colors">{l.label}</span>
                                    <span className="block text-[10px] text-subtle leading-tight">{l.sub}</span>
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {user.role === "enseignant" && (
              <>
                <Link href="/enseignant/cours"
                  className="px-3 h-16 flex items-center text-[13px] font-semibold border-b-2 border-transparent text-muted hover:text-cama transition-all duration-200 whitespace-nowrap">
                  Mes matières
                </Link>
                <div className="relative">
                  <button onClick={() => setMoreOpen(!moreOpen)}
                    className={`px-3 h-16 flex items-center gap-1 text-[13px] font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      moreOpen ? "border-cama text-cama" : "border-transparent text-muted hover:text-ink"}`}>
                    Plus <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                  </button>
                  {moreOpen && (
                    <div className="absolute left-0 top-full mt-0 w-52 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-50 animate-scale-in">
                      {[
                        { href: "/dashboard?tab=%C3%89valuations", icon: BookOpen,      label: "Évaluations" },
                        { href: "/bibliotheque",       icon: Library,       label: "Ma bibliothèque" },
                        { href: "/presences",          icon: ClipboardList, label: "Présences" },
                      ].map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-ink hover:bg-surface transition-colors">
                          <l.icon className="w-4 h-4 text-cama" /> {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            {user.role === "etudiant" && (
              <>
                <Link href="/etudiant/programme"
                  className="px-3 h-16 flex items-center text-[13px] font-semibold border-b-2 border-transparent text-muted hover:text-cama transition-all duration-200 whitespace-nowrap">
                  Mon programme
                </Link>
                <div className="relative">
                  <button onClick={() => setMoreOpen(!moreOpen)}
                    className={`px-3 h-16 flex items-center gap-1 text-[13px] font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      moreOpen ? "border-cama text-cama" : "border-transparent text-muted hover:text-ink"}`}>
                    Plus <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                  </button>
                  {moreOpen && (
                    <div className="absolute left-0 top-full mt-0 w-52 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-50 animate-scale-in">
                      {[
                        { href: "/etudiant/examens",       icon: BookOpen,      label: "Examens" },
                        { href: "/tp",                     icon: ClipboardList, label: "TP & Machines" },
                        { href: "/bibliotheque",           icon: Library,       label: "Bibliothèque" },
                        { href: "/etudiant/parascolaire",  icon: Sparkles,      label: "Parascolaire" },
                        { href: "/etudiant/dossier",       icon: ClipboardList, label: "Mon dossier" },
                        { href: "/etudiant/bulletins",     icon: FileText,      label: "Mes bulletins" },
                        { href: "/etudiant/finance",       icon: Wallet,        label: "Ma scolarité" },
                        { href: "/messagerie",             icon: Megaphone,     label: "Messagerie" },
                        { href: "/forum",                  icon: MessagesSquare, label: "Forum & Communauté" },
                      ].map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-ink hover:bg-surface transition-colors">
                          <l.icon className="w-4 h-4 text-cama" /> {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            {user.role === "jury" && (
              <Link href="/jury/deliberations"
                className="px-3 h-16 flex items-center text-[13px] font-semibold border-b-2 border-transparent text-muted hover:text-cama transition-all duration-200 whitespace-nowrap">
                Délibérations
              </Link>
            )}
          </nav>

          {/* Séparateur */}
          <div className="hidden md:block w-px h-7 bg-border mx-1.5" />

          {/* Groupe 1 — utilitaires discrets */}
          <div className="flex items-center">
            <button className="flex items-center gap-1 px-2 py-2 text-muted hover:text-ink transition-colors rounded-lg hover:bg-surface" title="Langue">
              <Globe className="w-[18px] h-[18px]" />
              <span className="text-xs font-semibold hidden xl:block">FR</span>
            </button>
            <Link href="/guide" className="p-2 text-muted hover:text-ink transition-colors rounded-lg hover:bg-surface" title="Guide CAMA">
              <HelpCircle className="w-[18px] h-[18px]" />
            </Link>
            <Link href="/calendrier" className="p-2 text-muted hover:text-ink transition-colors rounded-lg hover:bg-surface" title="Calendrier académique annuel">
              <CalendarDays className="w-[18px] h-[18px]" />
            </Link>
            {user.role === "etudiant" && (
              <button
                onClick={() => setCalOpen(true)}
                className="p-2 text-muted hover:text-cama transition-colors rounded-lg hover:bg-surface"
                title="Mon planning personnel">
                <CalendarClock className="w-[18px] h-[18px]" />
              </button>
            )}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 transition-colors rounded-lg hover:bg-surface ${notifOpen ? "text-cama" : "text-muted hover:text-ink"}`}
                title="Notifications">
                <Bell className="w-[18px] h-[18px]" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-cama text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-border shadow-2xl overflow-hidden z-50 animate-scale-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gold-dark" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted">Notifications</p>
                      {unread > 0 && (
                        <span className="text-[9px] font-black bg-cama text-white px-1.5 py-0.5">{unread} non lu{unread > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-surface transition-colors">
                      <X className="w-4 h-4 text-subtle" />
                    </button>
                  </div>
                  <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
                    {notifs.length === 0 && (
                      <p className="p-6 text-center text-xs text-muted">Aucune notification pour le moment.</p>
                    )}
                    {notifs.map((n) => {
                      const inner = (
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 w-2 h-2 flex-shrink-0 ${n.read_at ? "bg-border" : "bg-cama"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gold-dark">{n.kind}</span>
                              <span className="text-[9px] text-subtle flex-shrink-0">{timeAgo(n.created_at)}</span>
                            </div>
                            <p className={`text-xs leading-snug ${n.read_at ? "font-semibold text-muted" : "font-bold text-ink"}`}>{n.title}</p>
                            {n.body && <p className="text-[11px] text-muted leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>}
                          </div>
                        </div>
                      );
                      return n.link ? (
                        <Link key={n.id} href={n.link} onClick={(e) => { e.preventDefault(); handleNotifClick(n); }}
                          className="block p-4 hover:bg-surface transition-colors">
                          {inner}
                        </Link>
                      ) : (
                        <div key={n.id} onClick={() => handleNotifClick(n)} className="p-4 hover:bg-surface transition-colors cursor-pointer">
                          {inner}
                        </div>
                      );
                    })}
                  </div>
                  {notifs.length > 0 && (
                    <div className="p-3 border-t border-border bg-surface">
                      <button onClick={handleMarkAll} disabled={unread === 0}
                        className="w-full text-[10px] font-black uppercase tracking-widest text-cama hover:underline disabled:text-muted disabled:no-underline">
                        Tout marquer lu
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Séparateur */}
          <div className="hidden md:block w-px h-7 bg-border mx-1.5" />

          {/* Groupe 2 — actions fortes */}
          <div className="flex items-center gap-1.5">

          {/* Profil — style NetAcad : icône + nom + rôle */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center pl-1 pr-2 py-1 rounded-full border border-border hover:border-cama/30 hover:bg-surface transition-all duration-300 group/pro"
              title={`${user.firstName} — ${user.roleLabel}`}
            >
              {/* Avatar cercle avec initiales */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${user.avatarColor}`}>
                {user.initials}
              </div>
              <div className="hidden md:block text-left max-w-0 opacity-0 group-hover/pro:max-w-[120px] group-hover/pro:opacity-100 group-hover/pro:ml-2 overflow-hidden whitespace-nowrap transition-all duration-300">
                <p className="text-[13px] font-bold text-ink leading-none">{user.firstName}</p>
                <p className="text-[10px] text-muted capitalize leading-none mt-0.5">{user.roleLabel}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-subtle ml-1 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown profil */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-border shadow-xl overflow-hidden animate-scale-in z-50">

                {/* En-tête profil */}
                <div className="p-4 border-b border-border"
                  style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-bold text-sm border-2 border-white/30`}>
                      {user.initials}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{user.name}</p>
                      <p className="text-white/60 text-xs">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                          {user.roleLabel}
                        </span>
                        {user.level && (
                          <span className="text-[10px] font-bold bg-gold/80 text-white px-2 py-0.5 rounded-full">
                            {user.level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <Link href="/profil" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface text-left transition-colors text-sm text-ink">
                    <User className="w-4 h-4 text-muted" /> Mon profil
                  </Link>
                  <Link href="/parametres" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface text-left transition-colors text-sm text-ink">
                    <Settings className="w-4 h-4 text-muted" /> Paramètres
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-left transition-colors text-sm text-red-600 font-medium"
                  >
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>{/* end Groupe 2 */}

        </div>
      </div>
    </header>

    {/* ── TIROIR MOBILE (hamburger) ── */}
    {mobileOpen && (
      <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
        <div className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] bg-white shadow-2xl flex flex-col animate-slide-in-left">
          {/* En-tête */}
          <div className="px-4 py-4 flex items-center justify-between text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-sm font-bold border-2 border-white/30 flex-shrink-0`}>
                {user.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight truncate">{user.name}</p>
                <p className="text-white/60 text-[11px] truncate">{user.roleLabel}</p>
              </div>
            </div>
            <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-white/15 rounded-lg transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Recherche */}
          <div className="p-3 border-b border-border flex-shrink-0">
            <button onClick={() => { setMobileOpen(false); router.push("/recherche"); }}
              className="w-full flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2.5 text-left text-sm text-subtle">
              <Search className="w-4 h-4 text-cama" /> Rechercher sur CAMA…
            </button>
          </div>

          {/* Liens */}
          <nav className="flex-1 overflow-y-auto py-2">
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-ink hover:bg-surface transition-colors border-b border-border">
              <LayoutDashboard className="w-4 h-4 text-cama" /> Tableau de bord
            </Link>
            {/* Onglets de la page */}
            {tabs.length > 0 && (
              <div className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-subtle">Onglets</div>
            )}
            {tabs.map((t) => (
              <button key={t} onClick={() => { onTab(t); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                  activeTab === t ? "text-cama font-bold bg-cama-50" : "text-ink hover:bg-surface"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-cama" /> {t}
              </button>
            ))}
            {/* Navigation du rôle */}
            <div className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-subtle">Navigation</div>
            {mobileLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
                <l.icon className="w-4 h-4 text-cama" /> {l.label}
              </Link>
            ))}
            {/* Utilitaires */}
            <div className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-subtle">Outils</div>
            <Link href="/calendrier" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
              <CalendarDays className="w-4 h-4 text-cama" /> Calendrier
            </Link>
            <Link href="/guide" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
              <HelpCircle className="w-4 h-4 text-cama" /> Guide CAMA
            </Link>
            <Link href="/profil" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
              <User className="w-4 h-4 text-cama" /> Mon profil
            </Link>
            <Link href="/parametres" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors">
              <Settings className="w-4 h-4 text-cama" /> Paramètres
            </Link>
          </nav>

          {/* Déconnexion */}
          <div className="p-3 border-t border-border flex-shrink-0">
            <button onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors">
              <LogOut className="w-4 h-4" /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
    )}

    <PersonalCalendarDrawer open={calOpen} onClose={() => setCalOpen(false)} />
    </>
  );
}
