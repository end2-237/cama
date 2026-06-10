"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Rend un élément flottant déplaçable sur l'écran.
   - L'offset (dx, dy) est appliqué via transform et persisté en localStorage.
   - Un déplacement > 6px supprime le clic suivant (wasDragged). */
export function useDragOffset(storageKey: string) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ px: 0, py: 0, ox: 0, oy: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setOffset(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [storageKey]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    moved.current = false;
    start.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - start.current.px;
    const dy = e.clientY - start.current.py;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.current = true;
    if (moved.current) {
      // borne dans la fenêtre pour ne jamais perdre le bouton
      const nx = Math.min(Math.max(start.current.ox + dx, -window.innerWidth + 80), window.innerWidth - 80);
      const ny = Math.min(Math.max(start.current.oy + dy, -window.innerHeight + 80), window.innerHeight - 80);
      setOffset({ x: nx, y: ny });
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (dragging.current && moved.current) {
      setOffset((o) => {
        try { localStorage.setItem(storageKey, JSON.stringify(o)); } catch { /* ignore */ }
        return o;
      });
    }
    dragging.current = false;
  }, [storageKey]);

  /* à poser sur onClickCapture pour annuler le clic après un drag */
  const suppressClick = useCallback((e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }, []);

  return {
    offset,
    style: { transform: `translate(${offset.x}px, ${offset.y}px)` } as React.CSSProperties,
    bind: { onPointerDown, onPointerMove, onPointerUp, onClickCapture: suppressClick },
  };
}
