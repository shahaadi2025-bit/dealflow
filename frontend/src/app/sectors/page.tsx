"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtPct, fmtX } from "@/lib/format";
import { PageFade } from "@/components/PageFade";

const LABELS: Record<string, string> = {
  saas: "SaaS", fintech: "Fintech", ev: "Electric Vehicles", healthcare: "Healthcare",
  cyber: "Cybersecurity", cloud_infra: "Cloud Infra", consumer: "Consumer", media: "Media",
};

export default function SectorsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sector-stats"],
    queryFn: () => api.sectorStats(),
  });

  return (
    <PageFade>
      <h1 className="font-serif text-3xl text-ink mb-2">Sector comparison</h1>
      <p className="text-dim text-[12px] mb-8">Median metrics across each screened sector, for context on what is typical.</p>

      {isLoading && <p className="text-dim py-12">Loading sector medians...</p>}
      {isError && <p className="text-down py-12">Could not load sector stats.</p>}

      {data && (
      <div className="overflow-x-auto">
        <table className="border-collapse w-full min-w-[640px] max-w-3xl">
          <thead>
            <tr className="border-b border-line text-dim text-[11px]">
              <th className="text-left py-3 pr-6 font-normal">Sector</th>
              <th className="text-right py-3 pr-6 font-normal">Companies</th>
              <th className="text-right py-3 pr-6 font-normal">Median growth</th>
              <th className="text-right py-3 pr-6 font-normal">Median gross margin</th>
              <th className="text-right py-3 pr-6 font-normal">Median FCF margin</th>
              <th className="text-right py-3 pr-6 font-normal">Median Rule of 40</th>
              <th className="text-right py-3 font-normal">Median EV/Rev</th>
            </tr>
          </thead>
          <tbody>
            {data.sectors.map((s, i) => (
              <motion.tr
                key={s.sector}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="border-b border-line/60"
              >
                <td className="py-3 pr-6 text-ink">{LABELS[s.sector] || s.sector}</td>
                <td className="py-3 pr-6 text-right text-ink tabular-nums">{s.company_count}</td>
                <td className="py-3 pr-6 text-right text-ink tabular-nums">{fmtPct(s.median_growth)}</td>
                <td className="py-3 pr-6 text-right text-ink tabular-nums">{fmtPct(s.median_gross_margin)}</td>
                <td className="py-3 pr-6 text-right text-ink tabular-nums">{fmtPct(s.median_fcf_margin)}</td>
                <td className="py-3 pr-6 text-right text-ink tabular-nums">{fmtPct(s.median_rule_of_40)}</td>
                <td className="py-3 text-right text-ink tabular-nums">{fmtX(s.median_ev_rev)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </PageFade>
  );
}