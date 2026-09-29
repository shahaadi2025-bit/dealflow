"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, Memo } from "@/lib/api";
import { fmtMoney, fmtPct, fmtPrice, fmtX } from "@/lib/format";
import { StatCell } from "@/components/StatCell";
import { FootballField } from "@/components/FootballField";
import { SensitivityGrid } from "@/components/SensitivityGrid";
import { MemoPanel } from "@/components/MemoPanel";

export default function CompanyPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = params.ticker.toUpperCase();

  const [growthStart, setGrowthStart] = useState<number | null>(null);
  const [growthEnd, setGrowthEnd] = useState<number | null>(null);
  const [wacc, setWacc] = useState<number | null>(null);
  const [terminalG, setTerminalG] = useState<number | null>(null);
  const [margin, setMargin] = useState<number | null>(null);

  const overrides = {
    growth_start: growthStart, growth_end: growthEnd, wacc, terminal_g: terminalG, fcf_margin_target: margin,
  };

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

  if (valuation.isLoading) return <p className="text-dim py-12">Loading {ticker}…</p>;
  if (valuation.isError)
    return <p className="text-down py-12">{(valuation.error as Error).message}</p>;

  const v = valuation.data!;
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

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <h1 className="font-serif text-3xl text-ink">{c.name}</h1>
          <p className="text-dim text-[12px] mt-1">{c.ticker} · as of {c.as_of}</p>
        </div>
        <div className="text-right">
          <div className="font-serif text-3xl text-ink tabular-nums">{fmtPrice(c.price)}</div>
          <div className="text-dim text-[11px]">current price</div>
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
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCell label="DCF value / share" value={fmtPrice(v.dcf.per_share)}
              sub={`${(((v.dcf.per_share / c.price) - 1) * 100).toFixed(0)}% vs. current`} />
            <StatCell label="Enterprise value" value={fmtMoney(v.dcf.ev)} />
            <StatCell label="Terminal value share of EV" value={v.dcf.tv_share != null ? fmtPct(v.dcf.tv_share) : "—"} />
          </div>
          <FootballField bars={v.football} currentPrice={c.price} />
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
            <p className="text-dim text-[11px] mt-3">Fewer than 3 peers had usable multiples — comps percentiles are omitted from the football field above.</p>
          )}
        </div>
      </div>

      <MemoPanel
        onGenerate={() => memoMutation.mutate()}
        isPending={memoMutation.isPending}
        isError={memoMutation.isError}
        error={memoMutation.error as Error | null}
        memo={memoMutation.data?.memo as Memo | undefined}
        companyName={c.name}
      />
    </div>
  );
}
