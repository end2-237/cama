"use client";

import { useState } from "react";
import DashNav from "@/components/dashboard/DashNav";
import Banner from "@/components/dashboard/Banner";
import StudentView from "@/components/dashboard/StudentView";
import TeacherView from "@/components/dashboard/TeacherView";
import AdminView from "@/components/dashboard/AdminView";

const profiles = [
  {
    id:       "etudiant"   as const,
    name:     "Jean-Paul Mbarga",
    role:     "Étudiant · L2",
    avatar:   "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=80",
    initials: "JP",
    color:    "bg-cama",
  },
  {
    id:       "enseignant" as const,
    name:     "Prof. Amina Bello",
    role:     "Enseignante",
    avatar:   "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=80&q=80",
    initials: "AB",
    color:    "bg-gold",
  },
  {
    id:       "admin"      as const,
    name:     "Serge Nkamgang",
    role:     "Administrateur",
    avatar:   "",
    initials: "SN",
    color:    "bg-cama-900",
  },
];

const tabsMap: Record<string, string[]> = {
  etudiant:   ["Mes Cours", "Calendrier", "Résultats"],
  enseignant: ["Mes Cours", "Étudiants",  "Évaluations"],
  admin:      ["Tableau de bord", "Utilisateurs", "Paramètres"],
};

export default function DashboardPage() {
  const [profileId, setProfileId] = useState<"etudiant"|"enseignant"|"admin">("etudiant");
  const [activeTab, setActiveTab] = useState("Mes Cours");

  const profile = profiles.find((p) => p.id === profileId)!;
  const tabs    = tabsMap[profileId];

  const handleSwitch = (id: typeof profileId) => {
    setProfileId(id);
    setActiveTab(tabsMap[id][0]);
  };

  return (
    <>
      <Banner />

      {/* Compense la bannière (48px) + navbar (64px) */}
      <div className="pt-[112px]">
        <DashNav
          profile={profile}
          profiles={profiles}
          onSwitch={handleSwitch}
          activeTab={activeTab}
          onTab={setActiveTab}
          tabs={tabs}
        />

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {profileId === "etudiant"   && <StudentView />}
          {profileId === "enseignant" && <TeacherView />}
          {profileId === "admin"      && <AdminView />}
        </main>
      </div>
    </>
  );
}
