"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtPct, fmtX } from "@/lib/format";

const LABELS: Record<string, string> = { saas: "SaaS", fintech: "Fintech", ev: "Electric Vehicles" };

function Row({ label, value, median, fmt, higherIsBetter = true }: {
  label: string; value: number | null; median: number | null; fmt: (v: number) => string; higherIsBetter?: boolean;
}) {
  if (value == null || median == null) return null;
  const diff = value - median;
  const good = higherIsBetter ? diff >= 0 : diff <= 0;
  return (
    <div className="flex items-center justify-between text-[12px] py-1.5">
      <span className="text-dim">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-ink tabular-nums">{fmt(value)}</span>
        <span className="text-dim text-[10px]">vs {fmt(median)} median</span>
        <span className={`text-[10px] tabular-nums ${good ? "text-up" : "text-down"}`}>
          {diff >= 0 ? "+" : ""}{fmt(diff)}
        </span>
      </div>
    </div>
  );
}

export function SectorBenchmark({ sector, growth, grossMargin, fcfMargin, evRev }: {
  sector: string; growth: number | null; grossMargin: number | null; fcfMargin: number | null; evRev: number | null;
}) {
  const { data } = useQuery({ queryKey: ["sector-stats"], queryFn: () => api.sectorStats() });
  const stats = data?.sectors.find((s) => s.sector === sector);
  if (!stats || stats.company_count < 5) return null;

  return (
    <div className="border border-line p-5">
      <div className="text-dim text-[11px] mb-3">
        Versus {LABELS[sector] || sector} median ({stats.company_count} companies)
      </div>
      <div className="divide-y divide-line/60">
        <Row label="Revenue growth" value={growth} median={stats.median_growth} fmt={(v) => fmtPct(v)} />
        <Row label="Gross margin" value={grossMargin} median={stats.median_gross_margin} fmt={(v) => fmtPct(v)} />
        <Row label="FCF margin" value={fcfMargin} median={stats.median_fcf_margin} fmt={(v) => fmtPct(v)} />
        <Row label="EV/Revenue" value={evRev} median={stats.median_ev_rev} fmt={(v) => fmtX(v)} higherIsBetter={false} />
      </div>
    </div>
  );
}