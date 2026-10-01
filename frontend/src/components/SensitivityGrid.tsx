"use client";
import { motion } from "framer-motion";
import { fmtPrice } from "@/lib/format";

export function SensitivityGrid({ waccs, tgs, grid, base }: {
  waccs: number[]; tgs: number[]; grid: (number | null)[][]; base: number;
}) {
  const flat = grid.flat().filter((v): v is number => v !== null);
  const min = Math.min(...flat), max = Math.max(...flat);
  const heat = (v: number) => {
    const t = (v - min) / (max - min || 1);
    const r = Math.round(18 + t * (192 - 18));
    const g = Math.round(22 + t * (138 - 22));
    const b = Math.round(27 + t * (46 - 27));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="border border-line p-5"
    >
      <div className="text-dim text-[11px] mb-4">Per-share value sensitivity - WACC vs. terminal growth</div>
      <table className="w-full text-center border-collapse text-[12px]">
        <thead>
          <tr>
            <th className="p-2 text-dim font-normal text-right pr-3">WACC down, growth across</th>
            {tgs.map((g) => (
              <th key={g} className="p-2 text-dim font-normal tabular-nums">{(g * 100).toFixed(1)}%</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {waccs.map((w, i) => (
            <tr key={w}>
              <td className="p-2 text-dim text-right pr-3 tabular-nums">{(w * 100).toFixed(1)}%</td>
              {grid[i].map((v, j) => (
                <td key={j} className="p-2 tabular-nums border border-bg" style={{ background: v ? heat(v) : "#0B0E11", color: v ? "#0B0E11" : "#8B94A0" }}>
                  {v ? fmtPrice(v) : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-dim text-[11px] mt-3">Base case: {fmtPrice(base)}/share (center cell)</p>
    </motion.div>
  );
}