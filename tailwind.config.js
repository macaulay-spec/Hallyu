/** @type {import('tailwindcss').Config} */
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
        // Spec §35A tokens — centralized here (D-20). Tune globally, never per-component.
        surface: "#0F0F0F",
        card: "#1A1A1A",
        "card-elevated": "#222222",
        line: "#2A2A2A",
        "text-primary": "#F5F5F5",
        "text-secondary": "#A3A3A3",
        "text-tertiary": "#6B6B6B",
        brand: {
          deep: "#4A1C6E",
          ocean: "#2D6CDF",
          DEFAULT: "#7B4FD8",
        },
        coral: "#FF6B6B",
        success: "#3ECF8E",
        warn: "#F5A623",
        danger: "#E5484D",
      },
      fontFamily: {
        inter: ["Inter"],
        "inter-bold": ["Inter-Bold"],
        "inter-semibold": ["Inter-SemiBold"],
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "16px",
        xl: "20px",
        full: "9999px",
      },
      spacing: {
        // 16px base grid (Spec §35A)
        0.5: "2px",
        4.5: "18px",
        5.5: "22px",
      },
    },
  },
  plugins: [],
};
