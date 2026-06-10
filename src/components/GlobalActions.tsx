"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AIAssistant from "@/components/AIAssistant";
import DiscussionsDock from "@/components/DiscussionsDock";
import SearchFab from "@/components/SearchFab";

/* Boutons d'action flottants disponibles sur toutes les pages
   (sauf authentification et examen sécurisé). Tous déplaçables. */
export default function GlobalActions() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;
  if (pathname.startsWith("/auth") || pathname.startsWith("/examen")) return null;

  return (
    <>
      <AIAssistant />
      <SearchFab />
      {user.role === "etudiant" && <DiscussionsDock />}
    </>
  );
}
