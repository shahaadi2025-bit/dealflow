"use client";
import { motion } from "framer-motion";
import { useId } from "react";

/** Two currents merging into one: the "flow" in DealFlow. */
export function Logo({ size = 22 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"
      initial={{ opacity: 0, scale: 0.85, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <defs>
        <linearGradient id={`g${id}`} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(56 189 248)" />
          <stop offset="0.55" stopColor="rgb(139 124 255)" />
          <stop offset="1" stopColor="rgb(255 138 61)" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill={`url(#g${id})`} />
      <motion.path d="M9 12 C 18 12, 17 20, 24 20" stroke="white" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.2 }} />
      <motion.path d="M9 28 C 18 28, 17 20, 24 20" stroke="white" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.35 }} />
      <motion.path d="M24 20 H31" stroke="white" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.8 }} />
      <circle cx="31.5" cy="20" r="2.4" fill="white" />
    </motion.svg>
  );
}
