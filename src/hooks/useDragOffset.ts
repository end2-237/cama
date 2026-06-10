"use client";

import { useCallback, useRef, useState } from "react";

/* Rend un élément flottant déplaçable sur l'écran.
   La position repart à zéro à chaque rechargement (comportement voulu).
   Un déplacement > 6px supprime le clic suivant pour éviter l'ouverture accidentelle. */
export function useDragOffset() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ px: 0, py: 0, ox: 0, oy: 0 });

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
      const nx = Math.min(Math.max(start.current.ox + dx, -window.innerWidth + 80), window.innerWidth - 80);
      const ny = Math.min(Math.max(start.current.oy + dy, -window.innerHeight + 80), window.innerHeight - 80);
      setOffset({ x: nx, y: ny });
    }
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  /* Annule le clic si on vient de glisser */
  const suppressClick = useCallback((e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }, []);

  return {
    style: { transform: `translate(${offset.x}px, ${offset.y}px)` } as React.CSSProperties,
    bind: { onPointerDown, onPointerMove, onPointerUp, onClickCapture: suppressClick },
  };
}
