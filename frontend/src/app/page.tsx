"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { api, ScreenRow } from "@/lib/api";
import { fmtMoney, fmtPct, fmtX } from "@/lib/format";
import { ScoreBar } from "@/components/ScoreBar";
import { TickerSearch } from "@/components/TickerSearch";
import { ScreenerSkeleton } from "@/components/Skeleton";
import { PageFade } from "@/components/PageFade";
import { Term } from "@/components/Term";

const SECTOR_LABELS: Record<string, string> = { saas: "SaaS", fintech: "Fintech", ev: "Electric Vehicles" };
type SortKey = "score" | "market_cap" | "growth" | "gross_margin" | "fcf_margin" | "rule_of_40" | "ev_rev";
type Mode = "saas" | "fintech" | "ev" | "custom";

export default function ScreenerPage() {
  return (
    <Suspense fallback={<p className="text-dim py-12">Loading...</p>}>
      <ScreenerInner />
    </Suspense>
  );
}

function ScreenerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(() => (searchParams.get("sector") as Mode) || "saas");
  const [minGrowth, setMinGrowth] = useState(() => searchParams.get("minGrowth") || "");
  const [minFcf, setMinFcf] = useState(() => searchParams.get("minFcf") || "");
  const [minMcap, setMinMcap] = useState(() => searchParams.get("minMcap") || "");
  const [maxMcap, setMaxMcap] = useState(() => searchParams.get("maxMcap") || "");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [customInput, setCustomInput] = useState("");
  const [customTickers, setCustomTickers] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (mode === "custom") return;
    const qs = new URLSearchParams();
    if (mode !== "saas") qs.set("sector", mode);
    if (minGrowth) qs.set("minGrowth", minGrowth);
    if (minFcf) qs.set("minFcf", minFcf);
    if (minMcap) qs.set("minMcap", minMcap);
    if (maxMcap) qs.set("maxMcap", maxMcap);
    const qsStr = qs.toString();
    router.replace(qsStr ? `/?${qsStr}` : "/", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, minGrowth, minFcf, minMcap, maxMcap]);

  const sectorQuery = useQuery({
    queryKey: ["screen", mode, minGrowth, minFcf, minMcap, maxMcap],
    queryFn: () =>
      api.screen({
        sector: mode,
        min_growth: minGrowth ? Number(minGrowth) / 100 : undefined,
        min_fcf_margin: minFcf ? Number(minFcf) / 100 : undefined,
        min_mcap: minMcap ? Number(minMcap) * 1e6 : undefined,
        max_mcap: maxMcap ? Number(maxMcap) * 1e6 : undefined,
        limit: 40,
      }),
    enabled: mode !== "custom",
  });

  const customMutation = useMutation({
    mutationFn: (tickers: string[]) => api.screenCustom(tickers),
  });

  const isLoading = mode === "custom" ? customMutation.isPending : sectorQuery.isLoading;
  const isError = mode === "custom" ? customMutation.isError : sectorQuery.isError;
  const error = mode === "custom" ? customMutation.error : sectorQuery.error;
  const data = mode === "custom" ? customMutation.data : sectorQuery.data;

  const rows = useMemo(() => {
    const base = data?.results ?? [];
    return [...base].sort((a, b) => {
      const va = a[sortKey] as number, vb = b[sortKey] as number;
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const runCustom = () => {
    const list = customInput.split(/[\s,]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
    if (list.length === 0) return;
    setCustomTickers(list);
    customMutation.mutate(list);
  };

  const toggleSelect = (ticker: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else if (next.size < 4) next.add(ticker);
      return next;
    });
  };

  const compare = () => {
    if (selected.size < 2) return;
    router.push(`/compare?tickers=${Array.from(selected).join(",")}`);
  };

  const Header = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      onClick={() => toggleSort(k)}
      className="py-2 pr-4 font-normal text-right cursor-pointer select-none hover:text-ink transition-colors"
    >
      <span onClick={(e) => e.stopPropagation()}><Term>{label}</Term></span>
      <span onClick={() => toggleSort(k)}>{sortKey === k && <span className="text-signal ml-1">{sortDir === "desc" ? "v" : "^"}</span>}</span>
    </th>
  );

  return (
    <PageFade>
      <section className="relative mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(var(--color-signal)) 0%, transparent 70%)" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-[640px] relative"
        >
          <h1 className="font-serif text-4xl leading-tight text-ink mb-3">
            Screen acquisition targets, backed by numbers you can trace.
          </h1>
          <p className="text-dim leading-relaxed">
            Every score breaks down into the criteria that produced it - growth, margin,
            leverage, deal size fit. Pick a name below, or look up any company directly.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="text-dim text-[11px] mb-1.5">Or analyze any ticker on the market</div>
          <TickerSearch variant="hero" />
        </motion.div>
      </section>

      <section className="mb-6 pb-6 border-b border-line space-y-4">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="block text-dim text-[11px] mb-1.5">Sector</label>
            <div className="flex border border-line relative">
              {([...(["saas", "fintech", "ev"] as const), "custom" as const]).map((key, i) => (
                <motion.button
                  key={key}
                  onClick={() => setMode(key)}
                  whileTap={{ scale: 0.96 }}
                  className={`relative px-3 py-2 text-[12px] transition-colors focus-ring ${i > 0 ? "border-l border-line" : ""} ${
                    mode === key ? "text-bg" : "text-dim hover:text-ink"
                  }`}
                >
                  {mode === key && (
                    <motion.div
                      layoutId="sector-pill"
                      className="absolute inset-0 bg-signal -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {key === "custom" ? "Custom list" : SECTOR_LABELS[key]}
                </motion.button>
              ))}
            </div>
          </div>

          {rows.length > 0 && (
            <div>
              <label className="block text-dim text-[11px] mb-1.5 invisible">Surprise</label>
              <button
                onClick={() => router.push(`/company/${rows[Math.floor(Math.random() * rows.length)].ticker}`)}
                className="border border-line px-3 py-2 text-[12px] text-dim hover:text-ink hover:border-signal transition-colors"
              >
                Surprise me
              </button>
            </div>
          )}

          {mode !== "custom" && (
            <>
              <div>
                <label className="block text-dim text-[11px] mb-1.5">Min. revenue growth %</label>
                <input value={minGrowth} onChange={(e) => setMinGrowth(e.target.value)} placeholder="e.g. 10"
                  className="w-28 bg-surface border border-line px-3 py-2 text-ink placeholder:text-dim/60 focus-ring" />
              </div>
              <div>
                <label className="block text-dim text-[11px] mb-1.5">Min. FCF margin %</label>
                <input value={minFcf} onChange={(e) => setMinFcf(e.target.value)} placeholder="e.g. 0"
                  className="w-28 bg-surface border border-line px-3 py-2 text-ink placeholder:text-dim/60 focus-ring" />
              </div>
              <div>
                <label className="block text-dim text-[11px] mb-1.5">Min. market cap $M</label>
                <input value={minMcap} onChange={(e) => setMinMcap(e.target.value)} placeholder="e.g. 500"
                  className="w-28 bg-surface border border-line px-3 py-2 text-ink placeholder:text-dim/60 focus-ring" />
              </div>
              <div>
                <label className="block text-dim text-[11px] mb-1.5">Max. market cap $M</label>
                <input value={maxMcap} onChange={(e) => setMaxMcap(e.target.value)} placeholder="e.g. 20000"
                  className="w-28 bg-surface border border-line px-3 py-2 text-ink placeholder:text-dim/60 focus-ring" />
              </div>
            </>
          )}

          {rows.length > 0 && (
            <p className="text-dim text-[11px] ml-auto">
              {rows.length} candidates{mode !== "custom" ? ` in ${SECTOR_LABELS[mode]}` : ""}
            </p>
          )}
        </div>

        {mode === "custom" && (
          <div className="flex gap-2 items-start">
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter tickers separated by commas or spaces, e.g. AAPL MSFT NVDA (up to 25)"
              rows={2}
              className="flex-1 bg-surface border border-line px-3 py-2 text-ink placeholder:text-dim/60 focus-ring text-[12px] max-w-xl"
            />
            <motion.button whileTap={{ scale: 0.96 }} onClick={runCustom} className="bg-signal text-bg px-4 py-2 text-[12px] font-medium hover:opacity-90 transition-opacity focus-ring">
              Screen list
            </motion.button>
          </div>
        )}

        {selected.size > 0 && (
          <div className="flex items-center gap-3">
            <p className="text-dim text-[11px]">{selected.size} selected for comparison</p>
            <button
              onClick={compare}
              disabled={selected.size < 2}
              className="border border-signal text-signal px-3 py-1.5 text-[11px] hover:bg-signal hover:text-bg transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-signal focus-ring"
            >
              Compare selected (2-4 companies)
            </button>
          </div>
        )}
      </section>

      {isLoading && (
        <div>
          <p className="text-dim text-[12px] mb-4">
            {mode === "custom" ? "Screening your list..." : `Loading ${SECTOR_LABELS[mode]} universe...`}
          </p>
          <ScreenerSkeleton />
        </div>
      )}

      {isError && (
        <div className="py-16 text-center border border-down/30 bg-down/5">
          <p className="text-down mb-1">Couldn&apos;t load the screener</p>
          <p className="text-dim text-[12px]">{(error as Error)?.message}</p>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && mode !== "custom" && (
        <div className="py-16 text-center">
          <p className="text-dim">No companies matched these filters.</p>
          <p className="text-dim text-[12px] mt-1">Try loosening the filters, or search a specific ticker above.</p>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && mode === "custom" && customTickers.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-dim">Enter tickers above and click &quot;Screen list&quot; to analyze any custom set of companies.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="text-dim text-[11px] border-b border-line">
                <th className="py-2 pr-2 font-normal w-8"></th>
                <th className="py-2 pr-4 font-normal">Company</th>
                <Header label="Market cap" k="market_cap" />
                <Header label="Growth" k="growth" />
                <Header label="Gross margin" k="gross_margin" />
                <Header label="FCF margin" k="fcf_margin" />
                <Header label="Rule of 40" k="rule_of_40" />
                <Header label="EV/Rev" k="ev_rev" />
                <th className="py-2 font-normal cursor-pointer hover:text-ink transition-colors" onClick={() => toggleSort("score")}>
                  Fit score{sortKey === "score" && <span className="text-signal ml-1">{sortDir === "desc" ? "v" : "^"}</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((r: ScreenRow, i: number) => (
                  <motion.tr
                    key={r.ticker}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
                    className="border-b border-line/60 hover:bg-surface transition-colors group"
                  >
                    <td className="py-3 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.has(r.ticker)}
                        onChange={() => toggleSelect(r.ticker)}
                        className="accent-[rgb(var(--color-signal))]"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <Link href={`/company/${r.ticker}`} className="focus-ring flex items-center gap-2">
                        <div>
                          <div className="text-ink group-hover:text-signal transition-colors flex items-center gap-1.5">
                            {r.ticker}
                            <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-signal" />
                          </div>
                          <div className="text-dim text-[11px]">{r.name}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-right text-ink tabular-nums">{fmtMoney(r.market_cap)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1" style={{ color: r.growth >= 0.15 ? "rgb(var(--color-up))" : r.growth < 0 ? "rgb(var(--color-down))" : "rgb(var(--color-ink))" }}>
                        {r.growth >= 0.15 ? <TrendingUp size={11} /> : r.growth < 0 ? <TrendingDown size={11} /> : null}
                        {fmtPct(r.growth)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-ink tabular-nums">{fmtPct(r.gross_margin)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums" style={{ color: r.fcf_margin >= 0 ? "rgb(var(--color-ink))" : "rgb(var(--color-down))" }}>
                      {fmtPct(r.fcf_margin)}
                    </td>
                    <td className="py-3 pr-4 text-right text-ink tabular-nums">{fmtPct(r.rule_of_40)}</td>
                    <td className="py-3 pr-4 text-right text-ink tabular-nums">{fmtX(r.ev_rev)}</td>
                    <td className="py-3">
                      <ScoreBar score={r.score} drivers={r.drivers} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-dim text-[11px]">
            Fit score method: <span className="text-ink">{rows[0].method}</span> - hover a score bar for its drivers - check rows to compare.
          </p>
          {rows[0].method === "xgboost" && (
            <p className="text-signal text-[11px]">
              Experimental: this score comes from a model trained on a small set of historical deals (20 examples).
              Treat relative ranking as a rough signal, not a precise probability.
              {mode === "ev" && " The training data had no electric-vehicle acquisitions, so EV scores here are unvalidated extrapolation - weight them least."}
            </p>
          )}
        </div>
      )}
    </PageFade>
  );
}