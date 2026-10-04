"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtPct, fmtX } from "@/lib/format";

export function SimilarCompanies({ ticker }: { ticker: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["similar", ticker],
    queryFn: () => api.similarCompanies(ticker),
    retry: false,
  });

  if (isError) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="border border-line p-5"
    >
      <div className="text-dim text-[11px] mb-4">Companies with similar growth, margin, and size profiles</div>
      {isLoading && <p className="text-dim text-[12px]">Finding similar companies...</p>}
      {data && data.results.length === 0 && <p className="text-dim text-[12px]">No close matches found in this sector.</p>}
      {data && data.results.length > 0 && (
        <div className="space-y-2">
          {data.results.map((r) => (
            <Link
              key={r.ticker}
              href={`/company/${r.ticker}`}
              className="flex items-center justify-between py-2 border-b border-line/60 last:border-0 hover:bg-bg transition-colors px-1 -mx-1 group"
            >
              <div>
                <span className="text-ink group-hover:text-signal transition-colors">{r.ticker}</span>
                <span className="text-dim text-[11px] ml-2">{r.name}</span>
              </div>
              <div className="flex gap-4 text-[11px] text-dim tabular-nums">
                <span>{fmtPct(r.growth)} growth</span>
                <span>{fmtX(r.ev_rev)} EV/Rev</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}