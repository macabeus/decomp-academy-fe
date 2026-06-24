import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0d1117",
          soft: "#161b22",
          softer: "#1c2128",
          inset: "#0a0d12",
        },
        line: "#222b38",
        accent: {
          DEFAULT: "#7c93ff",
          soft: "#5468d4",
        },
        good: "#3fb950",
        warn: "#d29922",
        bad: "#f85149",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-good": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(63,185,80,0.4)" },
          "50%": { boxShadow: "0 0 0 6px rgba(63,185,80,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "pulse-good": "pulse-good 1.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
