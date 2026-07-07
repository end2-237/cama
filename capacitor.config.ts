import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuration Capacitor — application mobile CAMA.
 *
 * Mode HYBRIDE : l'app native charge directement le déploiement web
 * (Vercel), ce qui rend l'application mobile « automatiquement » à jour
 * sans re-build à chaque évolution du site. Pour un build 100 % hors-ligne,
 * retirer `server.url` et pointer `webDir` sur un export statique.
 *
 * Remplacer l'URL par votre domaine de production si besoin.
 */
const SERVER_URL = process.env.CAMA_APP_URL || "https://cama-liard.vercel.app";

const config: CapacitorConfig = {
  appId: "cm.jfn.cama",
  appName: "CAMA",
  webDir: "public",
  server: {
    url: SERVER_URL,
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#4F46E5",
    },
  },
};

export default config;
