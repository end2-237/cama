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
        green: {
          DEFAULT: "#49A942",
          dark:    "#3a8a34",
          light:   "#e8f5e7",
        },
        navy: {
          DEFAULT: "#1B2B4B",
          dark:    "#131f36",
          light:   "#243660",
        },
        charcoal: "#2C2C2C",
        ink:      "#1a1a1a",
        muted:    "#555555",
        subtle:   "#888888",
        border:   "#E5E5E5",
        surface:  "#F5F5F5",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["5rem",   { lineHeight: "1.05", fontWeight: "300" }],
        "display-lg": ["4rem",   { lineHeight: "1.08", fontWeight: "300" }],
        "display-md": ["3rem",   { lineHeight: "1.1",  fontWeight: "300" }],
        "display-sm": ["2.25rem",{ lineHeight: "1.15", fontWeight: "300" }],
      },
    },
  },
  plugins: [],
};

export default config;
