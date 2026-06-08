"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Grid3x3, Search, ChevronDown, Globe, HelpCircle,
  Bell, LogOut, User, Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DashNavProps {
  activeTab: string;
  onTab:     (t: string) => void;
  tabs:      string[];
}

export default function DashNav({ activeTab, onTab, tabs }: DashNavProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (!user) return null;

  return (
    <header className="fixed top-[48px] inset-x-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

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

          {/* Explore */}
          <button className="hidden md:flex items-center gap-2 border border-ink/30 rounded-full px-4 py-1.5 text-sm font-medium text-ink hover:bg-surface hover:border-cama/40 transition-all active:scale-95">
            <Grid3x3 className="w-4 h-4" />
            Explorer
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-sm items-center gap-2 bg-surface rounded-full px-4 py-2 border border-border focus-within:border-cama focus-within:ring-2 focus-within:ring-cama/10 transition-all">
            <Search className="w-4 h-4 text-subtle flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher cours, ressources..."
              className="bg-transparent text-sm text-ink placeholder-subtle outline-none w-full"
            />
          </div>

          <div className="flex-1" />

          {/* Tabs */}
          <nav className="hidden md:flex items-center h-16">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => onTab(t)}
                className={`px-4 h-full text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === t
                    ? "border-cama text-cama"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          {/* Icônes */}
          <div className="flex items-center gap-0.5 ml-2">
            <button className="flex items-center gap-1 px-2 py-2 text-muted hover:text-ink transition-colors rounded-lg hover:bg-surface">
              <Globe className="w-5 h-5" />
              <span className="text-xs font-semibold hidden lg:block">FR</span>
            </button>
            <button className="p-2 text-muted hover:text-ink transition-colors rounded-lg hover:bg-surface">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="relative p-2 text-muted hover:text-ink transition-colors rounded-lg hover:bg-surface">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 border-2 border-white" />
            </button>
          </div>

          {/* Profil — style NetAcad : icône + nom + rôle */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-border hover:border-cama/30 hover:bg-surface transition-all group"
            >
              {/* Avatar cercle avec initiales */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${user.avatarColor}`}>
                {user.initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-ink leading-none">{user.firstName}</p>
                <p className="text-[11px] text-muted capitalize leading-none mt-0.5">{user.roleLabel}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-subtle transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
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
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface text-left transition-colors text-sm text-ink">
                    <User className="w-4 h-4 text-muted" /> Mon profil
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface text-left transition-colors text-sm text-ink">
                    <Settings className="w-4 h-4 text-muted" /> Paramètres
                  </button>
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

        </div>
      </div>
    </header>
  );
}
