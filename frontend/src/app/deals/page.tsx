"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PageFade } from "@/components/PageFade";
import { api } from "@/lib/api";
import { fmtPct, fmtX } from "@/lib/format";

export default function DealsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["deals"], queryFn: () => api.deals() });

  return (
    <PageFade>
      <h1 className="font-serif text-3xl text-ink mb-2">Recent comparable transactions</h1>
      <p className="text-dim text-[12px] mb-8 max-w-2xl">
        The historical acquisitions used to train the experimental ML scoring model - a reference
        set, not a live feed. Figures are sourced from SEC filings and press coverage; see the
        confidence label on each.
      </p>

      {isLoading && <p className="text-dim py-12">Loading...</p>}
      {isError && <p className="text-down py-12">Could not load deals.</p>}

      {data && (
        <div className="space-y-3 max-w-3xl">
          {data.deals.map((d, i) => (
            <motion.div
              key={d.ticker}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              className="border border-line p-4"
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-ink text-[14px]">{d.ticker}</span>
                <span className={`text-[10px] px-1.5 py-0.5 border ${d.confidence === "verified" ? "border-up text-up" : "border-signal text-signal"}`}>
                  {d.confidence}
                </span>
              </div>
              <p className="text-dim text-[12px] leading-relaxed mb-2">{d.note}</p>
              <div className="flex gap-4 text-[11px] text-dim tabular-nums">
                <span>{fmtX(d.ev_rev)} EV/Revenue at deal</span>
                <span>{fmtPct(d.growth)} growth at deal</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageFade>
  );
}