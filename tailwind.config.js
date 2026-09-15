/** @type {import('tailwindcss').Config} */

// Hallyu design tokens (Spec §35A, centralized per D-20).
//
// The visual language is "deep plum noir": an ink-plum canvas so the drama art
// is the brightest thing on screen, a violet→azure brand gradient that bleeds
// from the header behind a wave edge, and glassy cards that float on top of it.
// Token names are stable — retune values here, never in components.
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Canvas
        ink: "#08050F",
        surface: "#0C0817",
        card: "#17112A",
        "card-elevated": "#241A3D",
        line: "rgba(255,255,255,0.09)",
        "line-strong": "rgba(255,255,255,0.16)",
        scrim: "rgba(6,3,12,0.55)",

        // Type
        "text-primary": "#F7F5FF",
        "text-secondary": "#AC9FC9",
        "text-tertiary": "#726690",

        // Brand gradient stops (deep plum → violet → azure)
        brand: {
          deep: "#2A0A45",
          violet: "#5B21C9",
          DEFAULT: "#7B3FE4",
          ocean: "#2E7CDF",
        },
        "brand-soft": "#8B5CF6",

        coral: "#FF6B81",
        success: "#3ECF8E",
        warn: "#F5A623",
        danger: "#E5484D",
      },
      fontFamily: {
        inter: ["Inter"],
        "inter-bold": ["Inter-Bold"],
        "inter-semibold": ["Inter-SemiBold"],
        // The wordmark is editorial — a serif, per the reference design.
        display: ["Georgia", "Times New Roman", "serif"],
      },
      fontSize: {
        display: ["40px", { lineHeight: "44px" }],
        hero: ["26px", { lineHeight: "32px" }],
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "26px",
        full: "9999px",
      },
      spacing: {
        // 16px base grid (Spec §35A)
        0.5: "2px",
        4.5: "18px",
        5.5: "22px",
        13: "52px",
        18: "72px",
      },
    },
  },
  plugins: [],
};
