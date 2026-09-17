import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* — Indigo profond : couleur principale CAMA (thémable par établissement) —
           Définie en canaux "R G B" via variables CSS pour préserver les opacités
           Tailwind (ex. bg-cama/20). Valeurs par défaut dans globals.css (:root). */
        cama: {
          50:  "rgb(var(--cama-50) / <alpha-value>)",
          100: "rgb(var(--cama-100) / <alpha-value>)",
          200: "rgb(var(--cama-200) / <alpha-value>)",
          300: "rgb(var(--cama-300) / <alpha-value>)",
          400: "rgb(var(--cama-400) / <alpha-value>)",
          500: "rgb(var(--cama-500) / <alpha-value>)",
          DEFAULT: "rgb(var(--cama-DEFAULT) / <alpha-value>)",
          700: "rgb(var(--cama-700) / <alpha-value>)",
          800: "rgb(var(--cama-800) / <alpha-value>)",
          900: "rgb(var(--cama-900) / <alpha-value>)",
        },
        /* — Or chaud : accent (thémable) — */
        gold: {
          light:   "rgb(var(--gold-light) / <alpha-value>)",
          DEFAULT: "rgb(var(--gold) / <alpha-value>)",
          dark:    "rgb(var(--gold-dark) / <alpha-value>)",
        },
        /* — Neutres — */
        ink:     "#111827",
        muted:   "#4B5563",
        subtle:  "#9CA3AF",
        border:  "#E5E7EB",
        surface: "#F9FAFB",
        charcoal:"#1F2937",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
