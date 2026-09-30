"use client";
import { useState } from "react";
import { Driver } from "@/lib/api";

export function ScoreBar({ score, drivers }: { score: number; drivers?: Driver[] }) {
  const [open, setOpen] = useState(false);
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div
      className="relative flex items-center gap-2 min-w-[110px]"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="h-1.5 flex-1 bg-line">
        <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-signal font-medium tabular-nums w-9 text-right">{score.toFixed(0)}</span>
      {open && drivers && drivers.length > 0 && (
        <div className="absolute z-20 top-full right-0 mt-2 w-56 bg-surface border border-line p-3 shadow-lg">
          <div className="text-dim text-[10px] mb-2 uppercase tracking-wide">Score drivers</div>
          {drivers.map((d) => (
            <div key={d.label} className="flex justify-between text-[11px] py-0.5">
              <span className="text-ink">{d.label}</span>
              <span className="text-signal tabular-nums">+{d.points.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
