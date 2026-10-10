"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtMoney, fmtPct } from "@/lib/format";

export function LboPanel({ ticker }: { ticker: string }) {
  const [leverage, setLev] = useState(5);
  const [growth, setGrowth] = useState(0.08);
  const [premium, setPrem] = useState(0.3);
  const body = { leverage, growth, premium, margin_expansion: 0 };
  const { data, isError, error } = useQuery({
    queryKey: ["lbo", ticker, leverage, growth, premium],
    queryFn: () => api.lbo(ticker, body), retry: false, placeholderData: (p) => p,
  });
  if (isError) return (
    <section className="glass p-5"><div className="text-dim text-[11px] mb-2">LBO sanity check</div>
      <p className="text-dim text-[12px]">{(error as Error).message}</p></section>
  );
  const r = data;
  const S = ({ label, v, set, min, max, step, fmt }: { label: string; v: number; set: (n: number) => void; min: number; max: number; step: number; fmt: (n: number) => string }) => (
    <label className="block">
      <span className="flex justify-between text-[11px] mb-1"><span className="text-dim">{label}</span><span className="text-ink tabular-nums">{fmt(v)}</span></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} className="w-full accent-[rgb(var(--color-signal))]" />
    </label>
  );
  return (
    <section className="glass p-5" aria-label="LBO sanity check">
      <div className="text-dim text-[11px] mb-1">LBO sanity check</div>
      <p className="text-dim text-[11px] mb-4">Could a financial sponsor earn 20%+ at this price? Simplified: constant exit multiple, cash sweep, 5-year hold.</p>
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <S label="Leverage (x EBITDA)" v={leverage} set={setLev} min={2} max={7} step={0.5} fmt={(n) => `${n.toFixed(1)}x`} />
        <S label="EBITDA growth" v={growth} set={setGrowth} min={0} max={0.25} step={0.01} fmt={(n) => fmtPct(n)} />
        <S label="Offer premium" v={premium} set={setPrem} min={0} max={0.6} step={0.05} fmt={(n) => fmtPct(n)} />
      </div>
      {r?.feasible && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Sponsor IRR" value={fmtPct(r.irr ?? 0)} tone={r.meets_20pct ? "up" : "down"} />
          <Stat label="MOIC" value={`${(r.moic ?? 0).toFixed(2)}x`} />
          <Stat label="Entry EV / EBITDA" value={`${(r.entry_multiple ?? 0).toFixed(1)}x`} />
          <Stat label="Max EV for 20% IRR" value={r.max_ev_for_20pct_irr ? fmtMoney(r.max_ev_for_20pct_irr) : "n/a"} />
        </div>
      )}
      {r?.feasible && (
        <p className="text-[12px] mt-3 text-dim">
          {r.meets_20pct ? "At this price a sponsor clears a 20% return, so a take-private is plausible." :
            "A sponsor would struggle to reach 20% at this price; a strategic buyer is the likelier acquirer."}
        </p>
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
