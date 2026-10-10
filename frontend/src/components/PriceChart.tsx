"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { fmtPrice } from "@/lib/format";

const PERIODS = ["3mo", "6mo", "1y", "2y", "5y"] as const;

export function PriceChart({ ticker, offerLow, offerHigh }: { ticker: string; offerLow?: number; offerHigh?: number }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("1y");
  const { data, isLoading } = useQuery({
    queryKey: ["prices", ticker, period], queryFn: () => api.pricesFor(ticker, period), staleTime: 600_000, retry: false,
  });
  const rows = data?.prices ?? [];
  if (!isLoading && rows.length === 0) return null;
  const first = rows[0]?.close, last = rows[rows.length - 1]?.close;
  const up = first && last ? last >= first : true;
  const color = up ? "rgb(var(--color-up))" : "rgb(var(--color-down))";
  const lo = rows.length ? Math.min(...rows.map((r) => r.close)) : 0;
  const hi = rows.length ? Math.max(...rows.map((r) => r.close)) : 0;
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-dim text-[11px]">
          Price history{first && last ? <span className={`ml-2 tabular-nums ${up ? "text-up" : "text-down"}`}>{(((last / first) - 1) * 100).toFixed(1)}%</span> : null}
        </div>
        <div className="flex gap-1" role="group" aria-label="Chart period">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} aria-pressed={period === p}
              className={`px-2 py-0.5 text-[11px] rounded-md focus-ring ${period === p ? "bg-signal text-bg" : "text-dim hover:text-ink"}`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="h-[220px]">
        {isLoading ? <div className="h-full shimmer rounded-lg" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`pg-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgb(var(--color-dim))" }} tickLine={false} axisLine={false} minTickGap={50} />
              <YAxis domain={[lo * 0.95, hi * 1.05]} tick={{ fontSize: 10, fill: "rgb(var(--color-dim))" }} tickLine={false} axisLine={false} width={44}
                tickFormatter={(v) => `$${Math.round(v)}`} />
              <Tooltip contentStyle={{ background: "rgb(var(--color-surface))", border: "1px solid rgb(var(--color-line))", borderRadius: 10, fontSize: 12 }}
                formatter={(v: number) => [fmtPrice(v), "Close"]} />
              <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill={`url(#pg-${ticker})`} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {offerLow && offerHigh ? <p className="text-dim text-[10.5px] mt-2">Illustrative offer range: {fmtPrice(offerLow)} - {fmtPrice(offerHigh)}</p> : null}
    </div>
  );
}
