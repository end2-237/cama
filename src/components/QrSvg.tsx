/** QR-code visuel déterministe (prototype) — motif stable dérivé de `data`. */
export default function QrSvg({ data, size = 88 }: { data: string; size?: number }) {
  const N = 21;
  /* PRNG déterministe simple basé sur la chaîne */
  let h = 2166136261;
  for (let i = 0; i < data.length; i++) { h ^= data.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967295; };

  const cells: boolean[][] = Array.from({ length: N }, () => Array.from({ length: N }, () => rand() > 0.5));

  /* Carrés de repère (finder patterns) */
  const finder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      const edge = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      cells[r0 + r][c0 + c] = edge || core;
    }
    /* zone blanche autour */
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = r0 + r, cc = c0 + c;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N && (r === -1 || r === 7 || c === -1 || c === 7)) cells[rr][cc] = false;
    }
  };
  finder(0, 0); finder(0, N - 7); finder(N - 7, 0);

  const s = size / N;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`QR ${data}`}>
      <rect width={size} height={size} fill="white" />
      {cells.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c * s} y={r * s} width={s + 0.3} height={s + 0.3} fill="#111827" /> : null
        )
      )}
    </svg>
  );
}
