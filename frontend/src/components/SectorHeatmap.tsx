"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { sectorLabel } from "@/lib/sectors";

/** Treemap-style heatmap: tile size = companies tracked, colour = median revenue growth. Real data from /sectors/stats. */
export function SectorHeatmap() {
  const { data } = useQuery({ queryKey: ["sector-stats"], queryFn: () => api.sectorStats(), staleTime: 300_000, retry: 1 });
  const rows = (data?.sectors ?? []).filter((s) => s.median_growth !== null).sort((a, b) => b.company_count - a.company_count);
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => Math.abs(r.median_growth ?? 0)), 0.01);
  return (
    <section className="mb-24" aria-labelledby="heat-h">
      <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
        <h2 id="heat-h" className="font-serif text-2xl sm:text-4xl text-ink">Sector heatmap</h2>
        <p className="text-dim text-[12px]">Tile size is companies tracked. Colour is median revenue growth. Click to screen.</p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-1.5 auto-rows-[74px] sm:auto-rows-[84px] grid-flow-dense">
        {rows.map((r, i) => {
          const g = r.median_growth ?? 0, a = Math.min(1, Math.abs(g) / max);
          const big = r.company_count >= 60, mid = r.company_count >= 40;
          const rgb = g >= 0 ? "var(--color-up)" : "var(--color-down)";
          return (
            <motion.div key={r.sector} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ delay: i * 0.025, duration: 0.35 }}
              className={big ? "col-span-2 row-span-2" : mid ? "col-span-2" : ""}>
              <Link href={`/screener?sector=${r.sector}`} aria-label={`${sectorLabel(r.sector)}, median growth ${(g * 100).toFixed(1)} percent`}
                className="h-full rounded-xl border border-line/60 p-2.5 flex flex-col justify-between hover:scale-[1.03] hover:z-10 transition-transform focus-ring"
                style={{ background: `linear-gradient(135deg, rgb(${rgb} / ${0.12 + a * 0.5}), rgb(${rgb} / ${0.05 + a * 0.2}))` }}>
                <span className="text-ink text-[11.5px] sm:text-[12.5px] leading-tight font-medium">{sectorLabel(r.sector)}</span>
                <span className={`tabular-nums text-[12px] sm:text-[13px] font-semibold ${g >= 0 ? "text-up" : "text-down"}`}>
                  {g >= 0 ? "▲" : "▼"} {Math.abs(g * 100).toFixed(1)}%
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
