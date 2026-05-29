import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "space-black": "#0a0a0f",
        "space-deep": "#050508",
        "space-surface": "#12121a",
        "space-border": "#1e1e2e",
        "gold": {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#d4a017",
          600: "#b8860b",
          700: "#92700c",
          800: "#6b5210",
          900: "#4a3708",
        },
        "nebula": {
          purple: "#7c3aed",
          blue: "#3b82f6",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        brand: ["var(--font-brand)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "star-twinkle": "twinkle 3s ease-in-out infinite",
        "warp-speed": "warp 2s ease-in forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        warp: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(0.95)", opacity: "0.8" },
          "100%": { transform: "scale(1.02)", opacity: "1" },
        },
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(212, 160, 23, 0.3)",
        "gold-intense": "0 0 40px rgba(212, 160, 23, 0.5)",
        "nebula": "0 0 60px rgba(124, 58, 237, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
