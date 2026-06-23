"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Grid3x3, Search, ChevronDown, Globe, HelpCircle,
  Bell, LogOut, User, Settings, Megaphone, X, FileText, Radio, AlertCircle,
  CalendarDays, CalendarClock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PersonalCalendarDrawer from "@/components/PersonalCalendarDrawer";

interface DashNavProps {
  activeTab: string;
  onTab:     (t: string) => void;
  tabs:      string[];
}

export default function DashNav({ activeTab, onTab, tabs }: DashNavProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const ADMIN_COMMS = [
    { icon: Megaphone, type: "Circulaire", color: "text-cama bg-cama/10", title: "Fermeture administrative — 14 juillet", body: "Les services administratifs seront fermés le 14 juillet. Les demandes urgentes sont à envoyer avant le 12 juillet.", time: "Il y a 1 jour" },
    { icon: AlertCircle, type: "Urgent", color: "text-red-500 bg-red-50", title: "Mise à jour des photos de carte étudiante", body: "Tous les étudiants doivent mettre à jour leur photo au secrétariat avant le 20 juin pour l'impression des nouvelles cartes.", time: "Il y a 2 jours" },
    { icon: FileText, type: "Note de service", color: "text-amber-600 bg-amber-50", title: "Calendrier des délibérations S4", body: "Les résultats du semestre 4 seront délibérés le 25 juin à 9h en salle A12. Présence non obligatoire pour les étudiants.", time: "Il y a 3 jours" },
    { icon: Radio, type: "Événement", color: "text-green-600 bg-green-50", title: "Cérémonie de remise des diplômes", body: "La cérémonie annuelle de remise des diplômes est programmée le 5 juillet à l'amphithéâtre principal. Invitation à venir chercher au secrétariat.", time: "Il y a 5 jours" },
  ];

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (!user) return null;

  return (
    <>
    <header className="fixed top-[48px] inset-x-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-2">

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
            {/* Liens BD réels par rôle */}
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
              </>
            )}
            {user.role === "enseignant" && (
              <>
                <Link href="/enseignant/cours"
                  className="px-3 h-16 flex items-center text-[13px] font-semibold border-b-2 border-transparent text-muted hover:text-cama transition-all duration-200 whitespace-nowrap">
                  Mes matières
                </Link>
                <Link href="/enseignant/examens"
                  className="px-3 h-16 flex items-center text-[13px] font-semibold border-b-2 border-transparent text-muted hover:text-cama transition-all duration-200 whitespace-nowrap">
                  Examens
                </Link>
              </>
            )}
            {user.role === "etudiant" && (
              <>
                <Link href="/etudiant/programme"
                  className="px-3 h-16 flex items-center text-[13px] font-semibold border-b-2 border-transparent text-muted hover:text-cama transition-all duration-200 whitespace-nowrap">
                  Mon programme
                </Link>
                <Link href="/etudiant/examens"
                  className="px-3 h-16 flex items-center text-[13px] font-semibold border-b-2 border-transparent text-muted hover:text-cama transition-all duration-200 whitespace-nowrap">
                  Examens
                </Link>
              </>
            )}
            {(user.role === "jury" || user.role === "admin") && (
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
            <button className="relative p-2 text-muted hover:text-ink transition-colors rounded-lg hover:bg-surface" title="Notifications">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 border-2 border-white" />
            </button>
          </div>

          {/* Séparateur */}
          <div className="hidden md:block w-px h-7 bg-border mx-1.5" />

          {/* Groupe 2 — actions fortes */}
          <div className="flex items-center gap-1.5">

            {/* Communication Administration */}
            <div className="relative">
              <button
                onClick={() => setCommOpen(!commOpen)}
                className={`relative flex items-center px-2.5 py-2 rounded-full text-xs font-bold transition-all group/adm ${
                  commOpen ? "bg-cama text-white" : "bg-cama/10 text-cama hover:bg-cama/20 border border-cama/20"
                }`}
                title="Communication Administration">
                <Megaphone className="w-4 h-4 flex-shrink-0" />
                <span className="hidden lg:block max-w-0 opacity-0 group-hover/adm:max-w-[110px] group-hover/adm:opacity-100 group-hover/adm:ml-1.5 overflow-hidden whitespace-nowrap transition-all duration-300">Administration</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">4</span>
              </button>

              {commOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl border border-border shadow-2xl overflow-hidden animate-scale-in z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-cama/5">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-cama" />
                      <p className="text-sm font-bold text-ink">Communication Administration</p>
                    </div>
                    <button onClick={() => setCommOpen(false)} className="p-1 hover:bg-surface rounded-lg transition-colors">
                      <X className="w-4 h-4 text-subtle" />
                    </button>
                  </div>
                  <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
                    {ADMIN_COMMS.map((c, i) => (
                      <div key={i} className="p-4 hover:bg-surface transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color.split(" ")[1]}`}>
                            <c.icon className={`w-4 h-4 ${c.color.split(" ")[0]}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.color.split(" ")[1]} ${c.color.split(" ")[0]}`}>{c.type}</span>
                              <span className="text-[9px] text-subtle flex-shrink-0">{c.time}</span>
                            </div>
                            <p className="text-xs font-bold text-ink leading-snug">{c.title}</p>
                            <p className="text-[11px] text-muted leading-relaxed mt-0.5 line-clamp-2">{c.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-border bg-surface">
                    <button className="w-full text-xs text-cama font-bold hover:underline">Voir toutes les communications →</button>
                  </div>
                </div>
              )}
            </div>

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

    <PersonalCalendarDrawer open={calOpen} onClose={() => setCalOpen(false)} />
    </>
  );
}
