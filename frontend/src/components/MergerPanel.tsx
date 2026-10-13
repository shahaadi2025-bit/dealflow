"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtMoney, fmtPct } from "@/lib/format";

/** Buyer + target merger model: premium, cash/stock mix and synergies drive FCF-per-share accretion. */
export function MergerPanel({ ticker }: { ticker: string }) {
  const buyers = useQuery({ queryKey: ["buyers", ticker], queryFn: () => api.buyers(ticker), staleTime: 300_000, retry: false });
  const [buyer, setBuyer] = useState("");
  const [premium, setPrem] = useState(0.3);
  const [stock, setStock] = useState(0.5);
  const [syn, setSyn] = useState(0.02);
  useEffect(() => { if (!buyer && buyers.data?.buyers[0]) setBuyer(buyers.data.buyers[0].ticker); }, [buyers.data, buyer]);
  const q = useQuery({
    queryKey: ["merger", ticker, buyer, premium, stock, syn], enabled: !!buyer, retry: false, placeholderData: (p) => p,
    queryFn: () => api.merger(ticker, { buyer, premium, stock_pct: stock, synergies_pct_rev: syn }),
  });
  const r = q.data;
  const S = ({ label, v, set, min, max, step }: { label: string; v: number; set: (n: number) => void; min: number; max: number; step: number }) => (
    <label className="block">
      <span className="flex justify-between text-[11px] mb-1"><span className="text-dim">{label}</span><span className="text-ink tabular-nums">{fmtPct(v, 0)}</span></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} className="w-full accent-[rgb(var(--color-signal))]" />
    </label>
  );
  return (
    <section className="glass p-5" aria-label="Merger model">
      <div className="text-dim text-[11px] mb-1">Merger model (accretion / dilution)</div>
      <p className="text-dim text-[11px] mb-4">If the buyer below acquired {ticker}, does free cash flow per share go up or down? Simplified; uses FCF because EPS is not in the data feed.</p>
      <label className="block mb-4 text-[11px] text-dim">Buyer
        <select value={buyer} onChange={(e) => setBuyer(e.target.value)} className="mt-1 w-full bg-surface border border-line rounded-lg px-3 py-2 text-[12px] text-ink focus-ring">
          {(buyers.data?.buyers ?? []).map((b) => <option key={b.ticker} value={b.ticker}>{b.ticker} - {b.name}</option>)}
        </select>
      </label>
      {buyers.isSuccess && buyers.data.buyers.length === 0 && <p className="text-dim text-[12px]">No plausible buyers found in the tracked universe.</p>}
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <S label="Offer premium" v={premium} set={setPrem} min={0} max={0.6} step={0.05} />
        <S label="Paid in stock" v={stock} set={setStock} min={0} max={1} step={0.1} />
        <S label="Synergies (% target revenue)" v={syn} set={setSyn} min={0} max={0.1} step={0.01} />
      </div>
      {q.isError && <p className="text-dim text-[12px]">{(q.error as Error).message}</p>}
      {r && !r.feasible && <p className="text-dim text-[12px]">{r.reason}</p>}
      {r?.feasible && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="FCF/share accretion" value={r.accretion == null ? "n/a" : fmtPct(r.accretion)} tone={r.accretive ? "up" : "down"} />
            <Stat label="Offer value" value={fmtMoney(r.offer_equity)} />
            <Stat label="New debt needed" value={fmtMoney(r.new_debt ?? 0)} />
            <Stat label="Pro-forma leverage" value={r.pf_leverage != null ? `${r.pf_leverage.toFixed(1)}x` : "n/a"} />
          </div>
          <p className="text-[12px] mt-3 text-dim leading-relaxed">
            {r.accretive ? `Accretive: ${r.buyer} holders would own a bigger cash-flow slice per share.` :
              `Dilutive by this measure. About ${fmtMoney(r.breakeven_synergies ?? 0)} of annual pre-tax synergies would be needed to break even.`}
            {" "}Target holders would own {fmtPct(r.ownership_to_target ?? 0)} of the combined company.
          </p>
        </>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-line px-3 py-2.5">
      <div className="text-dim text-[10.5px]">{label}</div>
      <div className={`font-serif text-xl tabular-nums ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink"}`}>{value}</div>
    </div>
  );
}
