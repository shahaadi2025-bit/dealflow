import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0E11",
        surface: "#12161B",
        line: "#242B33",
        ink: "#EDEEF0",
        dim: "#8B94A0",
        signal: "#C08A2E",
        up: "#4C9A6A",
        down: "#C0553A",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
