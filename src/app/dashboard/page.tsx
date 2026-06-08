"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashNav from "@/components/dashboard/DashNav";
import Banner from "@/components/dashboard/Banner";
import StudentView from "@/components/dashboard/StudentView";
import TeacherView from "@/components/dashboard/TeacherView";
import AdminView from "@/components/dashboard/AdminView";

const tabsMap: Record<string, string[]> = {
  etudiant:   ["Mes Cours", "Calendrier", "Résultats"],
  enseignant: ["Mes Cours", "Étudiants",  "Évaluations"],
  admin:      ["Tableau de bord", "Utilisateurs", "Paramètres"],
};

/* Stocke le tab actif par rôle sans useState global */
import { useState } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const tabs = user ? tabsMap[user.role] : [];
  const [activeTab, setActiveTab] = useState("");

  /* Initialise le tab actif au premier chargement du bon rôle */
  useEffect(() => {
    if (user) setActiveTab(tabsMap[user.role][0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Banner />

      {/* Banner 48px + Navbar 64px */}
      <div className="pt-[112px] min-h-screen bg-[#F9FAFB]">
        <DashNav tabs={tabs} activeTab={activeTab} onTab={setActiveTab} />

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up">
          {user.role === "etudiant"   && <StudentView />}
          {user.role === "enseignant" && <TeacherView />}
          {user.role === "admin"      && <AdminView />}
        </main>
      </div>
    </>
  );
}
