"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi; }
}
interface JitsiApi {
  dispose: () => void;
  addEventListener: (e: string, cb: (...a: unknown[]) => void) => void;
  executeCommand: (cmd: string, ...args: unknown[]) => void;
}

const JITSI_DOMAIN = "meet.jit.si";

function loadJitsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();
    const existing = document.getElementById("jitsi-external-api");
    if (existing) { existing.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.id = "jitsi-external-api";
    s.src = `https://${JITSI_DOMAIN}/external_api.js`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Impossible de charger Jitsi"));
    document.body.appendChild(s);
  });
}

interface Props {
  room: string;
  displayName: string;
  email?: string;
  isModerator?: boolean;
  onLeave?: () => void;
}

export default function JitsiRoom({ room, displayName, email, isModerator, onLeave }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    loadJitsiScript()
      .then(() => {
        if (disposed || !ref.current || !window.JitsiMeetExternalAPI) return;
        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: room,
          parentNode: ref.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName, email: email ?? "" },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            startWithAudioMuted: !isModerator,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "desktop", "fullscreen", "hangup",
              "chat", "raisehand", "tileview", "settings", "videoquality",
              "filmstrip", "participants-pane",
            ],
          },
        });
        apiRef.current = api;
        api.addEventListener("videoConferenceJoined", () => setLoading(false));
        api.addEventListener("readyToClose", () => onLeave?.());
      })
      .catch((e) => setError(e.message));

    return () => {
      disposed = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-ink text-white text-sm p-6 text-center">
        {error}. Vérifiez votre connexion ou réessayez.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-ink">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80 z-10">
          <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          <p className="text-sm">Connexion à la classe virtuelle…</p>
        </div>
      )}
      <div ref={ref} className="w-full h-full" />
    </div>
  );
}
