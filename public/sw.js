/* Service worker CAMA — notifications web fiables + support PWA.
   • Affiche les notifications (via registration.showNotification depuis la page).
   • Gère le clic : ouvre/refocalise l'onglet sur le lien de la notification.
   • Prêt pour le Web Push (VAPID) : l'écouteur « push » est déjà branché. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Réception d'un push serveur (Web Push / FCM web) — optionnel, actif si
// un backend envoie des push. Charge utile JSON attendue : {title, body, link}.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = data.title || "CAMA";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag,
    data: { link: data.link || "/dashboard" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur une notification : va sur le lien, en réutilisant un onglet ouvert.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
