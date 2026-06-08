"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Grid3x3, Search, ChevronDown, Globe, HelpCircle,
  Bell, BookOpen, LayoutDashboard, GraduationCap,
  ShieldCheck,
} from "lucide-react";

interface Profile {
  id: "etudiant" | "enseignant" | "admin";
  name: string;
  role: string;
  avatar: string;
  initials: string;
  color: string;
}

interface DashNavProps {
  profile: Profile;
  onSwitch: (id: Profile["id"]) => void;
  profiles: Profile[];
  activeTab: string;
  onTab: (t: string) => void;
  tabs: string[];
}

export default function DashNav({ profile, onSwitch, profiles, activeTab, onTab, tabs }: DashNavProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifCount] = useState(3);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-border shadow-sm">
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

          {/* Explore pill */}
          <button className="hidden md:flex items-center gap-2 border border-ink/30 rounded-full px-4 py-1.5 text-sm font-medium text-ink hover:bg-surface transition-colors">
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
          <nav className="hidden md:flex items-center">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => onTab(t)}
                className={`px-4 h-16 text-sm font-semibold border-b-2 transition-all duration-200 ${
                  activeTab === t
                    ? "border-cama text-cama"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1 ml-2">
            <button className="p-2 text-muted hover:text-ink transition-colors">
              <Globe className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted hover:text-ink transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            {/* Cloche avec badge */}
            <button className="relative p-2 text-muted hover:text-ink transition-colors">
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cama border-2 border-white" />
              )}
            </button>
          </div>

          {/* Profile switcher */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full border border-border hover:border-cama/30 hover:bg-surface transition-all"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${profile.color}`}>
                {profile.initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-ink leading-none">{profile.name.split(" ")[0]}</p>
                <p className="text-[10px] text-muted capitalize">{profile.role}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-subtle transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-border shadow-xl overflow-hidden animate-scale-in z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Changer de profil</p>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { onSwitch(p.id); setProfileOpen(false); }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-150 ${
                        profile.id === p.id ? "bg-cama-50" : "hover:bg-surface"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${p.color}`}>
                        {p.initials}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${profile.id === p.id ? "text-cama" : "text-ink"}`}>{p.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {p.id === "etudiant"   && <GraduationCap className="w-3 h-3 text-muted" />}
                          {p.id === "enseignant" && <BookOpen className="w-3 h-3 text-muted" />}
                          {p.id === "admin"      && <ShieldCheck className="w-3 h-3 text-muted" />}
                          <p className="text-[11px] text-muted capitalize">{p.role}</p>
                        </div>
                      </div>
                      {profile.id === p.id && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-cama" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-3">
                  <button className="w-full text-sm text-left px-3 py-2 rounded-xl hover:bg-surface text-muted hover:text-ink transition-colors flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Mon profil
                  </button>
                  <Link href="/" className="w-full text-sm text-left px-3 py-2 rounded-xl hover:bg-red-50 text-muted hover:text-red-500 transition-colors flex items-center gap-2">
                    <span className="w-4 h-4 text-center">↩</span> Déconnexion
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
