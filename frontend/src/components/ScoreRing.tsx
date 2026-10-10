"use client";
import { motion } from "framer-motion";
import { useId } from "react";

/** Radial gauge for the 0-100 fit score. */
export function ScoreRing({ score, size = 96, label = "Fit score" }: { score: number; size?: number; label?: string }) {
  const id = useId().replace(/:/g, "");
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="rgb(56 189 248)" /><stop offset="0.5" stopColor="rgb(139 124 255)" /><stop offset="1" stopColor="rgb(255 138 61)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(var(--color-line))" strokeOpacity="0.7" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" stroke={`url(#s${id})`} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif tabular-nums text-ink leading-none" style={{ fontSize: size * 0.28 }}>{Math.round(score)}</span>
        <span className="text-dim" style={{ fontSize: Math.max(8, size * 0.1) }}>{label}</span>
      </div>
    </div>
  );
}
