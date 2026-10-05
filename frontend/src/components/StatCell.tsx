"use client";
import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";

export function StatCell({ label, value, sub, delay = 0, numeric, format }: {
  label: string; value: string; sub?: string; delay?: number;
  numeric?: number; format?: (v: number) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ borderColor: "rgb(var(--color-signal))" }}
      className="border border-line p-4 transition-colors"
    >
      <div className="text-dim text-[11px] mb-1.5">{label}</div>
      <div className="font-serif text-2xl text-ink">
        {numeric !== undefined && format ? <AnimatedNumber value={numeric} format={format} /> : value}
      </div>
      {sub && <div className="text-dim text-[11px] mt-1">{sub}</div>}
    </motion.div>
  );
}