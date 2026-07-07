"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { initNotifications, showLocalNotification } from "@/lib/pushNotifications";
import type { DBNotification } from "@/lib/notifications";

/* Pont de notifications global (monté une fois dans le layout).
   • Initialise les permissions et le push natif (Capacitor/FCM) à la connexion.
   • Écoute les nouvelles notifications temps réel et les affiche comme
     notification système (locale) — même quand la cloche n'est pas visible. */
export default function NotificationsBridge() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cleanup: (() => void) | undefined;
    let alive = true;

    initNotifications(userId).then((c) => { if (alive) cleanup = c; else c(); });

    const channel = supabase
      .channel(`sysnotifs-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as DBNotification;
          if (!n) return;
          void showLocalNotification({
            title: n.title,
            body: n.body ?? undefined,
            link: n.link ?? undefined,
            tag: n.id,
          });
        },
      )
      .subscribe();

    return () => {
      alive = false;
      cleanup?.();
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
