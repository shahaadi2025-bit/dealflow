"use client";
import { motion } from "framer-motion";
import { fmtPrice } from "@/lib/format";

/** 52-week range gauge: where the price sits between the low and the high. */
export function RangeBar({ low, high, price }: { low: number | null; high: number | null; price: number }) {
  if (!low || !high || high <= low) return null;
  const pos = Math.max(0, Math.min(1, (price - low) / (high - low)));
  return (
    <div className="min-w-[200px]">
      <div className="flex justify-between text-[10.5px] text-dim tabular-nums mb-1.5"><span>{fmtPrice(low)}</span><span>52-week range</span><span>{fmtPrice(high)}</span></div>
      <div className="relative h-2 rounded-full bg-line/50">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos * 100}%`, background: "linear-gradient(90deg, rgb(var(--color-down)), rgb(var(--color-signal)) 60%, rgb(var(--color-up)))" }} />
        <motion.span initial={{ left: "0%" }} animate={{ left: `${pos * 100}%` }} transition={{ duration: 1, ease: "easeOut" }}
          className="absolute -top-1 w-4 h-4 -ml-2 rounded-full bg-ink border-2 border-bg shadow-[0_0_0_3px_rgb(var(--color-signal)/0.5)]" />
      </div>
      <div className="text-[10.5px] text-dim mt-1.5 text-center">{Math.round(pos * 100)}% of the way from low to high</div>
    </div>
  );
}
