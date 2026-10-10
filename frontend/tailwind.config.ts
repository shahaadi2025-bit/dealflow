import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        dim: "rgb(var(--color-dim) / <alpha-value>)",
        signal: "rgb(var(--color-signal) / <alpha-value>)",
        up: "rgb(var(--color-up) / <alpha-value>)",
        down: "rgb(var(--color-down) / <alpha-value>)",
        cyan: "rgb(var(--color-cyan) / <alpha-value>)",
        violet: "rgb(var(--color-violet) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;