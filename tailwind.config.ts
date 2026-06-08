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
        /* — Indigo profond : couleur principale CAMA — */
        cama: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          DEFAULT: "#4F46E5",   /* indigo */
          700: "#4338CA",
          800: "#3730A3",
          900: "#1E1B4B",
        },
        /* — Or chaud : accent africain — */
        gold: {
          light:   "#FEF3C7",
          DEFAULT: "#F59E0B",
          dark:    "#D97706",
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
