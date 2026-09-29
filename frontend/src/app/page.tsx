"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtMoney, fmtPct, fmtX } from "@/lib/format";
import { ScoreBar } from "@/components/ScoreBar";

const SECTOR_LABELS: Record<string, string> = { saas: "SaaS", fintech: "Fintech", ev: "Electric Vehicles" };

export default function ScreenerPage() {
  const [sector, setSector] = useState("saas");
  const [minGrowth, setMinGrowth] = useState("");
  const [minFcf, setMinFcf] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["screen", sector, minGrowth, minFcf],
    queryFn: () =>
      api.screen({
        sector,
        min_growth: minGrowth ? Number(minGrowth) / 100 : undefined,
        min_fcf_margin: minFcf ? Number(minFcf) / 100 : undefined,
        limit: 25,
      }),
  });

  const rows = data?.results ?? [];
  const topDriverLabel = useMemo(() => (rows[0]?.drivers?.[0]?.label ?? null), [rows]);

  return (
    <div>
      <section className="mb-10 max-w-[720px]">
        <h1 className="font-serif text-4xl leading-tight text-ink mb-3">
          Screen acquisition targets, backed by numbers you can trace.
        </h1>
        <p className="text-dim leading-relaxed">
          Every score below breaks down into the financial criteria that produced it —
          growth, margin, leverage, and deal size fit. Pick a name to run a full DCF and
          comparables valuation.
        </p>
      </section>

      <section className="flex flex-wrap items-end gap-6 mb-6 pb-6 border-b border-line">
        <div>
          <label className="block text-dim text-[11px] mb-1.5">Sector</label>
          <div className="flex border border-line">
            {Object.entries(SECTOR_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSector(key)}
                className={`px-3 py-2 text-[12px] transition-colors focus-ring ${
                  sector === key ? "bg-signal text-bg" : "text-dim hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-dim text-[11px] mb-1.5">Min. revenue growth %</label>
          <input
            value={minGrowth}
            onChange={(e) => setMinGrowth(e.target.value)}
            placeholder="e.g. 10"
            className="w-32 bg-surface border border-line px-3 py-2 text-ink placeholder:text-dim/60 focus-ring"
          />
        </div>
        <div>
          <label className="block text-dim text-[11px] mb-1.5">Min. FCF margin %</label>
          <input
            value={minFcf}
            onChange={(e) => setMinFcf(e.target.value)}
            placeholder="e.g. 0"
            className="w-32 bg-surface border border-line px-3 py-2 text-ink placeholder:text-dim/60 focus-ring"
          />
        </div>
        {rows.length > 0 && (
          <p className="text-dim text-[11px] ml-auto">
            {rows.length} candidates · top driver this run: <span className="text-ink">{topDriverLabel}</span>
          </p>
        )}
      </section>

      {isLoading && <p className="text-dim py-12">Loading {SECTOR_LABELS[sector]} universe…</p>}
      {isError && (
        <p className="text-down py-12">
          Couldn&apos;t load the screener: {(error as Error).message}. Confirm the API URL is set and the backend is running.
        </p>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className="text-dim py-12">No companies matched these filters. Loosen the growth or margin thresholds.</p>
      )}

      {rows.length > 0 && (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-dim text-[11px] border-b border-line">
              <th className="py-2 pr-4 font-normal">Company</th>
              <th className="py-2 pr-4 font-normal text-right">Market cap</th>
              <th className="py-2 pr-4 font-normal text-right">Growth</th>
              <th className="py-2 pr-4 font-normal text-right">Gross margin</th>
              <th className="py-2 pr-4 font-normal text-right">FCF margin</th>
              <th className="py-2 pr-4 font-normal text-right">Rule of 40</th>
              <th className="py-2 pr-4 font-normal text-right">EV/Rev</th>
              <th className="py-2 font-normal">Fit score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ticker} className="border-b border-line/60 hover:bg-surface transition-colors group">
                <td className="py-3 pr-4">
                  <Link href={`/company/${r.ticker}`} className="focus-ring">
                    <div className="text-ink group-hover:text-signal transition-colors">{r.ticker}</div>
                    <div className="text-dim text-[11px]">{r.name}</div>
                  </Link>
                </td>
                <td className="py-3 pr-4 text-right text-ink tabular-nums">{fmtMoney(r.market_cap)}</td>
                <td className="py-3 pr-4 text-right tabular-nums" style={{ color: r.growth >= 0.15 ? "#4C9A6A" : "#EDEEF0" }}>
                  {fmtPct(r.growth)}
                </td>
                <td className="py-3 pr-4 text-right text-ink tabular-nums">{fmtPct(r.gross_margin)}</td>
                <td className="py-3 pr-4 text-right tabular-nums" style={{ color: r.fcf_margin >= 0 ? "#EDEEF0" : "#C0553A" }}>
                  {fmtPct(r.fcf_margin)}
                </td>
                <td className="py-3 pr-4 text-right text-ink tabular-nums">{fmtPct(r.rule_of_40)}</td>
                <td className="py-3 pr-4 text-right text-ink tabular-nums">{fmtX(r.ev_rev)}</td>
                <td className="py-3">
                  <ScoreBar score={r.score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rows.length > 0 && (
        <p className="text-dim text-[11px] mt-4">
          Fit score method: <span className="text-ink">{rows[0].method}</span>. Weighted, explainable criteria — not a prediction of an announced deal.
        </p>
      )}
    </div>
  );
}
