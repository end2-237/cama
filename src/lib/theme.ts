/* ════════════════════════════════════════════════════════════
   CAMA — Thème dynamique par établissement (white-label)
   À partir d'une seule couleur de marque, on génère l'échelle
   50→900 et on l'écrit en variables CSS (canaux "R G B") pour
   rester compatible avec les opacités Tailwind (ex. bg-cama/20).
════════════════════════════════════════════════════════════ */

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function hexToRgb(hex: string): RGB | null {
  const m = hex.trim().replace("#", "");
  const s = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToChannels(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return `${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}`;
}

// Cibles de luminosité par palier (calées sur l'indigo CAMA d'origine).
const LSTOPS: Record<string, number> = {
  "50": 96, "100": 92, "200": 86, "300": 78, "400": 70,
  "500": 63, DEFAULT: 58, "700": 50, "800": 40, "900": 26,
};

/** Construit l'échelle {palier: "R G B"} à partir d'une couleur de marque. */
export function buildScale(hex: string): Record<string, string> {
  const rgb = hexToRgb(hex);
  if (!rgb) return {};
  const { h, s } = rgbToHsl(rgb);
  const sat = Math.max(35, Math.min(92, s)); // garde une saturation lisible
  const out: Record<string, string> = {};
  for (const [k, l] of Object.entries(LSTOPS)) out[k] = hslToChannels(h, sat, l);
  return out;
}

/** Dérive une échelle d'accent (light/DEFAULT/dark) depuis une couleur. */
export function buildAccent(hex: string): Record<string, string> | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const { h, s } = rgbToHsl(rgb);
  const sat = Math.max(45, Math.min(95, s));
  return {
    light: hslToChannels(h, Math.min(100, sat + 5), 90),
    DEFAULT: hslToChannels(h, sat, 51),
    dark: hslToChannels(h, sat, 44),
  };
}

/** Applique le thème d'un institut sur un élément racine (document.documentElement). */
export function applyTheme(root: HTMLElement, primary?: string | null, accent?: string | null) {
  if (primary) {
    const scale = buildScale(primary);
    for (const [k, v] of Object.entries(scale)) {
      root.style.setProperty(k === "DEFAULT" ? "--cama-DEFAULT" : `--cama-${k}`, v);
    }
  }
  if (accent) {
    const a = buildAccent(accent);
    if (a) {
      root.style.setProperty("--gold-light", a.light);
      root.style.setProperty("--gold", a.DEFAULT);
      root.style.setProperty("--gold-dark", a.dark);
    }
  }
}

/** Réinitialise le thème aux valeurs par défaut (JFN) — retire les overrides. */
export function resetTheme(root: HTMLElement) {
  const keys = ["--cama-50", "--cama-100", "--cama-200", "--cama-300", "--cama-400",
    "--cama-500", "--cama-DEFAULT", "--cama-700", "--cama-800", "--cama-900",
    "--gold-light", "--gold", "--gold-dark"];
  for (const k of keys) root.style.removeProperty(k);
}
