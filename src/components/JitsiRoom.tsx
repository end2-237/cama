"use client";

import { useState } from "react";

interface Props {
  room: string;
  displayName: string;
  email?: string;
  isModerator?: boolean;
  onLeave?: () => void;
}

export default function JitsiRoom({ room, displayName, onLeave }: Props) {
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams({
    "config.prejoinPageEnabled": "false",
    "config.disableDeepLinking": "true",
    "config.startWithAudioMuted": "false",
    "config.startWithVideoMuted": "false",
    "interfaceConfig.MOBILE_APP_PROMO": "false",
    "interfaceConfig.SHOW_JITSI_WATERMARK": "false",
    "userInfo.displayName": displayName,
  });

  const src = `https://meet.jit.si/${encodeURIComponent(room)}#${params.toString()}`;

  return (
    <div className="relative w-full h-full bg-ink">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80 z-10">
          <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          <p className="text-sm">Connexion à la classe virtuelle…</p>
        </div>
      )}
      <iframe
        src={src}
        allow="camera; microphone; display-capture; autoplay; clipboard-write"
        allowFullScreen
        onLoad={() => setLoading(false)}
        className="w-full h-full border-0"
      />
      {!loading && onLeave && (
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
