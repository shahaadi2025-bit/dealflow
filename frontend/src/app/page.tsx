"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api, ScreenRow } from "@/lib/api";
import { fmtMoney, fmtPct, fmtX } from "@/lib/format";
import { ScoreBar } from "@/components/ScoreBar";
import { TickerSearch } from "@/components/TickerSearch";

const SECTOR_LABELS: Record<string, string> = { saas: "SaaS", fintech: "Fintech", ev: "Electric Vehicles" };
type SortKey = "score" | "market_cap" | "growth" | "gross_margin" | "fcf_margin" | "rule_of_40" | "ev_rev";

export default function ScreenerPage() {
  const [sector, setSector] = useState("saas");
  const [minGrowth, setMinGrowth] = useState("");
  const [minFcf, setMinFcf] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["screen", sector, minGrowth, minFcf],
    queryFn: () =>
      api.screen({
        sector,
        min_growth: minGrowth ? Number(minGrowth) / 100 : undefined,
        min_fcf_margin: minFcf ? Number(minFcf) / 100 : undefined,
        limit: 40,
      }),
  });

  const rows = useMemo(() => {
    const base = data?.results ?? [];
    const sorted = [...base].sort((a, b) => {
      const va = a[sortKey] as number, vb = b[sortKey] as number;
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return sorted;
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const Header = ({ label, k, align = "right" }: { label: string; k: SortKey; align?: "left" | "right" }) => (
    <th
      onClick={() => toggleSort(k)}
      className={`py-2 pr-4 font-normal cursor-pointer select-none hover:text-ink transition-colors ${align === "right" ? "text-right" : "text-left"}`}
    >
      {label}{sortKey === k && <span className="text-signal ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>}
    </th>
  );

  return (
    <div>
      <section className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-[640px]">
          <h1 className="font-serif text-4xl leading-tight text-ink mb-3">
            Screen acquisition targets, backed by numbers you can trace.
          </h1>
          <p className="text-dim leading-relaxed">
            Every score breaks down into the criteria that produced it — growth, margin,
            leverage, deal size fit. Pick a name below, or look up any company directly.
          </p>
        </div>
        <div>
          <div className="text-dim text-[11px] mb-1.5">Or analyze any ticker on the market</div>
          <TickerSearch variant="hero" />
        </div>
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
            {rows.length} candidates in {SECTOR_LABELS[sector]}{isFetching && !isLoading ? " · refreshing…" : ""}
          </p>
        )}
      </section>

      {isLoading && (
        <div className="py-16 text-center">
          <p className="text-dim">Loading {SECTOR_LABELS[sector]} universe — pulling live market data…</p>
        </div>
      )}

      {isError && (
        <div className="py-16 text-center border border-down/30 bg-down/5">
          <p className="text-down mb-1">Couldn&apos;t load the screener</p>
          <p className="text-dim text-[12px]">{(error as Error).message}</p>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-dim">No companies matched these filters.</p>
          <p className="text-dim text-[12px] mt-1">Try loosening the growth or margin thresholds, or search a specific ticker above.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="text-dim text-[11px] border-b border-line">
                <th className="py-2 pr-4 font-normal">Company</th>
                <Header label="Market cap" k="market_cap" />
                <Header label="Growth" k="growth" />
                <Header label="Gross margin" k="gross_margin" />
                <Header label="FCF margin" k="fcf_margin" />
                <Header label="Rule of 40" k="rule_of_40" />
                <Header label="EV/Rev" k="ev_rev" />
                <th className="py-2 font-normal cursor-pointer hover:text-ink transition-colors" onClick={() => toggleSort("score")}>
                  Fit score{sortKey === "score" && <span className="text-signal ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: ScreenRow) => (
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
                    <ScoreBar