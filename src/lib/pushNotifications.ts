/* ════════════════════════════════════════════════════════════
   NOTIFICATIONS SYSTÈME — locales (Web + Capacitor) & push (FCM)

   • Sur le WEB (navigateur / PWA) : utilise l'API Notification du
     navigateur pour afficher des notifications « locales » quand une
     nouvelle notification temps réel arrive.
   • Sur MOBILE (Capacitor Android/iOS) : utilise
     @capacitor/local-notifications pour l'affichage local et
     @capacitor/push-notifications (FCM natif sur Android) pour le push.
     Le jeton d'appareil est enregistré côté serveur (table push_tokens).

   Les imports Capacitor sont dynamiques pour ne jamais casser le build web.
════════════════════════════════════════════════════════════ */
import { supabase } from "@/lib/supabase";

let nativeChecked = false;
let _isNative = false;

/** Indique si l'on s'exécute dans l'app native Capacitor. */
async function isNative(): Promise<boolean> {
  if (nativeChecked) return _isNative;
  nativeChecked = true;
  try {
    const { Capacitor } = await import("@capacitor/core");
    _isNative = Capacitor.isNativePlatform();
  } catch {
    _isNative = false;
  }
  return _isNative;
}

/* ── Permissions ─────────────────────────────────────────── */

/** Demande la permission d'afficher des notifications (web + natif). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (await isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const res = await LocalNotifications.requestPermissions();
      return res.display === "granted";
    } catch {
      return false;
    }
  }
  // Web
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const p = await Notification.requestPermission();
    return p === "granted";
  } catch {
    return false;
  }
}

export function webPermissionState(): "default" | "granted" | "denied" | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/* ── Service worker (web) ─────────────────────────────────── */

let swReg: ServiceWorkerRegistration | null = null;

/** Enregistre le service worker CAMA (web). Idempotent. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (swReg) return swReg;
  try {
    swReg = await navigator.serviceWorker.register("/sw.js");
    return swReg;
  } catch {
    return null;
  }
}

/* ── Affichage d'une notification locale ─────────────────── */

export async function showLocalNotification(opts: {
  title: string;
  body?: string;
  link?: string;
  tag?: string;
}): Promise<void> {
  if (await isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 2_000_000_000),
          title: opts.title,
          body: opts.body ?? "",
          extra: { link: opts.link ?? null },
        }],
      });
    } catch { /* silencieux */ }
    return;
  }
  // Web
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Préférence : afficher via le service worker (fiable, cliquable, compatible
  // Chrome Android). Repli sur l'API Notification classique si indisponible.
  const reg = swReg ?? (await registerServiceWorker());
  if (reg) {
    try {
      await reg.showNotification(opts.title, {
        body: opts.body ?? "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: opts.tag,
        data: { link: opts.link ?? "/dashboard" },
      });
      return;
    } catch { /* repli ci-dessous */ }
  }
  try {
    const n = new Notification(opts.title, {
      body: opts.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: opts.tag,
    });
    if (opts.link) {
      n.onclick = () => {
        window.focus();
        window.location.href = opts.link!;
        n.close();
      };
    }
  } catch { /* silencieux */ }
}

/* ── Enregistrement du jeton push (natif uniquement) ─────── */

async function savePushToken(userId: string, token: string, platform: string) {
  try {
    await supabase.from("push_tokens").upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: "token" },
    );
  } catch { /* la table peut ne pas exister encore */ }
}

/**
 * Initialise les notifications pour l'utilisateur connecté.
 * — Web : demande la permission (silencieusement idempotent).
 * — Natif : configure les canaux, enregistre le jeton FCM et écoute
 *   les push entrants pour les afficher.
 * Renvoie une fonction de nettoyage.
 */
export async function initNotifications(userId: string): Promise<() => void> {
  // Web : enregistre le service worker (affichage fiable des notifications).
  if (!(await isNative())) {
    await registerServiceWorker();
    // On ne force pas la permission au chargement (bonne pratique) : elle est
    // demandée par le bouton « Activer les notifications ». Si déjà accordée, RAS.
    return () => {};
  }

  const cleanups: Array<() => void> = [];
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { Capacitor } = await import("@capacitor/core");
    const platform = Capacitor.getPlatform();

    await LocalNotifications.requestPermissions();

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive === "granted") {
      await PushNotifications.register();
    }

    const h1 = await PushNotifications.addListener("registration", (t) => {
      void savePushToken(userId, t.value, platform);
    });
    const h2 = await PushNotifications.addListener("pushNotificationReceived", (notif) => {
      // Affiche en local quand l'app est au premier plan.
      void showLocalNotification({
        title: notif.title ?? "CAMA",
        body: notif.body ?? "",
        link: (notif.data && (notif.data.link as string)) || undefined,
      });
    });
    const h3 = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const link = action.notification.data?.link as string | undefined;
      if (link && typeof window !== "undefined") window.location.href = link;
    });

    cleanups.push(() => { void h1.remove(); void h2.remove(); void h3.remove(); });
  } catch { /* plugins indisponibles */ }

  return () => cleanups.forEach((c) => c());
}
