"use client";

import { useEffect, useState } from "react";

interface Props {
  room: string;
  displayName: string;
  email?: string;
  isModerator?: boolean;
  onLeave?: () => void;
}

export default function JitsiRoom({ room, displayName, email, isModerator, onLeave }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/jitsi-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room,
            name: displayName,
            email: email ?? "",
            moderator: !!isModerator,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur token");
        if (cancelled) return;

        const params = new URLSearchParams({
          jwt: data.jwt,
          "config.prejoinPageEnabled": "false",
          "config.disableDeepLinking": "true",
          "interfaceConfig.MOBILE_APP_PROMO": "false",
          "userInfo.displayName": displayName,
        });
        setSrc(`https://8x8.vc/${data.appId}/${encodeURIComponent(room)}#${params.toString()}`);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de connexion");
      }
    })();
    return () => { cancelled = true; };
  }, [room, displayName, email, isModerator]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-ink text-white text-sm p-6 text-center">
        {error}. Vérifiez la configuration JaaS ou réessayez.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-ink">
      {(loading || !src) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80 z-10">
          <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          <p className="text-sm">Connexion à la classe virtuelle…</p>
        </div>
      )}
      {src && (
        <iframe
          src={src}
          allow="camera; microphone; display-capture; autoplay; clipboard-write"
          allowFullScreen
          onLoad={() => setLoading(false)}
          className="w-full h-full border-0"
        />
      )}
      {!loading && src && onLeave && (
        <button
          onClick={onLeave}
          className="absolute top-3 left-3 z-20 text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
        >
          Quitter
        </button>
      )}
    </div>
  );
}
