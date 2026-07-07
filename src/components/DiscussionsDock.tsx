"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDragOffset } from "@/hooks/useDragOffset";
import { countUnread } from "@/lib/governance";

/* Bouton flottant Messagerie (étudiant).
   Ramène toujours vers la page /messagerie (source unique de vérité),
   avec un badge du nombre de messages non lus. Masqué sur /messagerie. */
export default function DiscussionsDock() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { style: dragStyle, bind } = useDragOffset();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const n = await countUnread(user.id);
      if (!cancelled) setUnread(n);
    };
    load();
    const t = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(t); };
  }, [user, pathname]);

  if (!user) return null;
  // Inutile de proposer le raccourci quand on est déjà sur la messagerie.
  if (pathname.startsWith("/messagerie")) return null;

  return (
    <button
      {...bind}
      style={dragStyle}
      onClick={() => router.push("/messagerie")}
      className="fixed bottom-5 right-[88px] z-50 w-14 h-14 rounded-full bg-ink hover:bg-charcoal shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
      aria-label="Ouvrir la messagerie"
      title="Messagerie — glisser pour déplacer">
      <MessagesSquare className="w-6 h-6 text-gold" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
