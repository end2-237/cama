"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashNav from "@/components/dashboard/DashNav";
import Banner from "@/components/dashboard/Banner";
import StudentView from "@/components/dashboard/StudentView";
import TeacherView from "@/components/dashboard/TeacherView";
import AdminView from "@/components/dashboard/AdminView";
import JuryView from "@/components/dashboard/JuryView";
import Footer from "@/components/landing/Footer";
import WelcomeModal from "@/components/WelcomeModal";
import OnboardingTour from "@/components/OnboardingTour";
import GlobalActions from "@/components/GlobalActions";

const tabsMap: Record<string, string[]> = {
  etudiant:   ["Mes Cours", "Examens", "Résultats"],
  enseignant: ["Mes Cours", "Étudiants", "Évaluations"],
  admin:      ["Tableau de bord", "Utilisateurs", "Paramètres"],
  jury:       ["Délibérations", "Cas d'intégrité"],
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const tabs = user ? tabsMap[user.role] : [];
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (user) setActiveTab(tabsMap[user.role][0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  /* Toujours revenir en haut quand on change d'onglet */
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab]);

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

        <main
          className={`max-w-[1400px] mx-auto animate-fade-up ${
            user.role === "etudiant" || user.role === "enseignant"
              ? "" /* layout 3 colonnes edge-to-edge : feed collé à la nav */
              : "px-4 sm:px-6 lg:px-8 py-6"
          }`}
          key={activeTab}>
          {user.role === "etudiant"   && <StudentView tab={activeTab} />}
          {user.role === "enseignant" && <TeacherView tab={activeTab} />}
          {user.role === "admin"      && <AdminView />}
          {user.role === "jury"       && <JuryView tab={activeTab} />}
        </main>
        <Footer />
      </div>

      {/* Global overlays & assistant */}
      <WelcomeModal />
      <OnboardingTour />
      <GlobalActions />
    </>
  );
}
