"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Share2, FileDown, Check } from "lucide-react";
import { api, Memo } from "@/lib/api";
import { fmtMoney, fmtPct, fmtPrice, fmtX } from "@/lib/format";
import { StatCell } from "@/components/StatCell";
import { FootballField } from "@/components/FootballField";
import { SensitivityGrid } from "@/components/SensitivityGrid";
import { MemoPanel } from "@/components/MemoPanel";
import { RevenueChart } from "@/components/RevenueChart";
import { SectorBenchmark } from "@/components/SectorBenchmark";
import { CompanyNotes } from "@/components/CompanyNotes";
import { valuationToCsv, downloadCsv } from "@/lib/csv";
import { CompanySkeleton } from "@/components/Skeleton";
import { PageFade } from "@/components/PageFade";

function num(v: string | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function CompanyPage() {
  return (
    <Suspense fallback={<p className="text-dim py-12">Loading...</p>}>
      <CompanyInner />
    </Suspense>
  );
}

function CompanyInner() {
  const params = useParams<{ ticker: string }>();
  const ticker = params.ticker.toUpperCase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [growthStart, setGrowthStart] = useState<number | null>(() => num(searchParams.get("gs")));
  const [growthEnd, setGrowthEnd] = useState<number | null>(() => num(searchParams.get("ge")));
  const [wacc, setWacc] = useState<number | null>(() => num(searchParams.get("w")));
  const [terminalG, setTerminalG] = useState<number | null>(() => num(searchParams.get("tg")));
  const [margin, setMargin] = useState<number | null>(() => num(searchParams.get("m")));
  const [copied, setCopied] = useState(false);

  const overrides = {
    growth_start: growthStart, growth_end: growthEnd, wacc, terminal_g: terminalG, fcf_margin_target: margin,
  };

  // keep the URL in sync with slider state so the current scenario is shareable
  useEffect(() => {
    const qs = new URLSearchParams();
    if (growthStart !== null) qs.set("gs", String(growthStart));
    if (growthEnd !== null) qs.set("ge", String(growthEnd));
    if (wacc !== null) qs.set("w", String(wacc));
    if (terminalG !== null) qs.set("tg", String(terminalG));
    if (margin !== null) qs.set("m", String(margin));
    const qsStr = qs.toString();
    router.replace(qsStr ? `/company/${ticker}?${qsStr}` : `/company/${ticker}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [growthStart, growthEnd, wacc, terminalG, margin, ticker]);

  const valuation = useQuery({
    queryKey: ["valuate", ticker, overrides],
    queryFn: () => api.valuate(ticker, overrides),
  });

  const memoMutation = useMutation({
    mutationFn: () => {
      if (!valuation.data) throw new Error("Run a valuation first");
      return api.memo(valuation.data);
    },
  });

  const base = valuation.data?.assumptions;
  const scenarioQueries = useQueries({
    queries: base
      ? [
          { key: "bear", growth_end: Math.max(0, base.growth_end - 0.05), wacc: base.wacc + 0.02 },
          { key: "base", growth_end: base.growth_end, wacc: base.wacc },
          { key: "bull", growth_end: base.growth_end + 0.05, wacc: Math.max(base.terminal_g + 0.01, base.wacc - 0.02) },
        ].map((s) => ({
          queryKey: ["scenario", ticker, s.key, s.growth_end, s.wacc],
          queryFn: () => api.valuate(ticker, { growth_end: s.growth_end, wacc: s.wacc }),
          enabled: !!base,
        }))
      : [],
  });

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const downloadReport = () => {
    window.open(api.reportPdfUrl(ticker), "_blank");
  };

  if (valuation.isLoading) return <CompanySkeleton />;
  if (valuation.isError)
    return <p className="text-down py-12">{(valuation.error as Error).message}</p>;
  if (!valuation.data)
    return <p className="text-dim py-12">No data available for {ticker} yet. Try refreshing in a moment.</p>;

  const v = valuation.data;
  const c = v.company;
  const a = v.assumptions;

  const Slider = ({ label, value, onChange, min, max, step, fmt }: {
    label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; fmt: (v: number) => string;
  }) => (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-dim">{label}</span>
        <span className="text-ink tabular-nums">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#C08A2E]" />
    </div>
  );

  const scenarioLabels = ["Bear", "Base", "Bull"];

  return (
    <PageFade>
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-2">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-ink break-words">{c.name}</h1>
          <p className="text-dim text-[12px] mt-1">{c.ticker} - as of {c.as_of}</p>
        </div>
        <div className="sm:text-right">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="font-serif text-3xl text-ink tabular-nums"
          >
            {fmtPrice(c.price)}
          </motion.div>
          <div className="text-dim text-[11px]">current price</div>
          <div className="flex flex-wrap gap-2 mt-2 sm:justify-end">
            <button onClick={copyLink}
              className="border border-line px-3 py-1 text-[11px] text-dim hover:text-ink hover:border-signal transition-colors focus-ring flex items-center gap-1.5">
              {copied ? <Check size={12} className="text-up" /> : <Share2 size={12} />}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Share link"}</span>
            </button>
            <button onClick={downloadReport}
              className="border border-line px-3 py-1 text-[11px] text-dim hover:text-ink hover:border-signal transition-colors focus-ring flex items-center gap-1.5">
              <FileDown size={12} />
              <span className="hidden sm:inline">PDF report</span>
            </button>
            <button onClick={() => downloadCsv(`${c.ticker}_valuation.csv`, valuationToCsv(v))}
              className="border border-line px-3 py-1 text-[11px] text-dim hover:text-ink hover:border-signal transition-colors focus-ring flex items-center gap-1.5">
              <FileDown size={12} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-6">
        <StatCell label="Market cap" value={fmtMoney(c.market_cap)} />
        <StatCell label="Revenue (LTM)" value={fmtMoney(c.revenue)} sub={c.rev_growth != null ? `${fmtPct(c.rev_growth)} growth` : undefined} />
        <StatCell label="Gross margin" value={fmtPct(c.gross_margin)} />
        <StatCell label="FCF margin" value={fmtPct(c.fcf_margin)} />
        <StatCell label="Net debt" value={fmtMoney(c.net_debt)} sub={c.net_debt < 0 ? "net cash" : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 mb-6">
        <div className="border border-line p-5 h-fit">
          <div className="text-ink text-[13px] mb-4">DCF assumptions</div>
          <div className="space-y-5">
            <Slider label="Year-1 growth" value={growthStart ?? a.growth_start} min={0} max={0.4} step={0.01}
              onChange={setGrowthStart} fmt={(v) => `${(v * 100).toFixed(0)}%`} />
            <Slider label="Year-5 growth" value={growthEnd ?? a.growth_end} min={0} max={0.3} step={0.01}
              onChange={setGrowthEnd} fmt={(v) => `${(v * 100).toFixed(0)}%`} />
            <Slider label="Target FCF margin" value={margin ?? a.fcf_margin_target} min={-0.1} max={0.5} step={0.01}
              onChange={setMargin} fmt={(v) => `${(v * 100).toFixed(0)}%`} />
            <Slider label="WACC" value={wacc ?? a.wacc} min={0.06} max={0.16} step={0.001}
              onChange={setWacc} fmt={(v) => `${(v * 100).toFixed(1)}%`} />
            <Slider label="Terminal growth" value={terminalG ?? a.terminal_g} min={0.01} max={0.045} step={0.001}
              onChange={setTerminalG} fmt={(v) => `${(v * 100).toFixed(1)}%`} />
          </div>
          <button
            onClick={() => { setGrowthStart(null); setGrowthEnd(null); setWacc(null); setTerminalG(null); setMargin(null); }}
            className="mt-5 text-dim text-[11px] hover:text-ink transition-colors underline underline-offset-2"
          >
            Reset to base case
          </button>

          <div className="mt-6 pt-5 border-t border-line">
            <div className="text-ink text-[13px] mb-3">Scenarios</div>
            <div className="space-y-2">
              {scenarioQueries.map((q, i) => (
                <div key={scenarioLabels[i]} className="flex justify-between text-[12px]">
                  <span className="text-dim">{scenarioLabels[i]}</span>
                  <span className="text-ink tabular-nums">
                    {q.isLoading ? "..." : q.data ? fmtPrice(q.data.dcf.per_share) : "-"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-dim text-[10px] mt-2">Bear/bull vary growth and WACC around your current assumptions.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCell label="DCF value / share" value={fmtPrice(v.dcf.per_share)}
              numeric={v.dcf.per_share} format={fmtPrice}
              sub={`${(((v.dcf.per_share / c.price) - 1) * 100).toFixed(0)}% vs. current`} />
            <StatCell label="Enterprise value" value={fmtMoney(v.dcf.ev)} numeric={v.dcf.ev} format={(x) => fmtMoney(x)} />
            <StatCell label="Terminal value share of EV" value={v.dcf.tv_share != null ? fmtPct(v.dcf.tv_share) : "-"} />
          </div>
          <FootballField bars={v.football} currentPrice={c.price} />
          <RevenueChart history={c.history} />
          {c.sector && (
            <SectorBenchmark
              sector={c.sector}
              growth={c.rev_growth}
              grossMargin={c.gross_margin}
              fcfMargin={c.fcf_margin}
              evRev={c.revenue ? c.ev / c.revenue : null}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SensitivityGrid waccs={v.sensitivity.waccs} tgs={v.sensitivity.tgs} grid={v.sensitivity.grid} base={v.dcf.per_share} />

        <div className="border border-line p-5">
          <div className="text-dim text-[11px] mb-4">Comparable companies</div>
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="text-dim border-b border-line">
                <th className="py-2 font-normal">Ticker</th>
                <th className="py-2 font-normal text-right">EV/Rev</th>
                <th className="py-2 font-normal text-right">EV/Gross profit</th>
                <th className="py-2 font-normal text-right">EV/EBITDA</th>
              </tr>
            </thead>
            <tbody>
              {v.comps.peers.map((p) => (
                <tr key={p.ticker} className="border-b border-line/60">
                  <td className="py-2 text-ink">{p.ticker}</td>
                  <td className="py-2 text-right tabular-nums">{fmtX(p.ev_rev ?? undefined)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtX(p.ev_gp ?? undefined)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtX(p.ev_ebitda ?? undefined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {v.comps.peers.length < 3 && (
            <p className="text-dim text-[11px] mt-3">Fewer than 3 peers had usable multiples - comps percentiles are omitted from the football field above.</p>
          )}
          {v.comps.excluded.length > 0 && (
            <details className="mt-3">
              <summary className="text-dim text-[11px] cursor-pointer hover:text-ink transition-colors">
                {v.comps.excluded.length} peer{v.comps.excluded.length > 1 ? "s" : ""} excluded - why?
              </summary>
              <ul className="mt-2 space-y-1">
                {v.comps.excluded.map((e) => (
                  <li key={e.ticker} className="text-dim text-[11px]">
                    <span className="text-ink">{e.ticker}</span>: {e.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      <div className="mb-6">
        <CompanyNotes ticker={c.ticker} />
      </div>

      <MemoPanel
        onGenerate={() => memoMutation.mutate()}
        isPending={memoMutation.isPending}
        isError={memoMutation.isError}
        error={memoMutation.error as Error | null}
        memo={memoMutation.data?.memo as Memo | undefined}
        companyName={c.name}
      />
    </PageFade>
  );
}