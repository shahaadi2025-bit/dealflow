"use client";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { ScreenRow } from "@/lib/api";
import { fmtMoney } from "@/lib/format";

/** Bubble chart: growth (x) vs EV/Revenue (y); bubble size is market cap, gold intensity is the fit score. */
export function ValuationMap({ rows }: { rows: ScreenRow[] }) {
  const data = rows.filter((r) => r.ev_rev > 0 && r.ev_rev < 60 && Math.abs(r.growth) < 1.5)
    .map((r) => ({ x: +(r.growth * 100).toFixed(1), y: +r.ev_rev.toFixed(2), z: r.market_cap, ticker: r.ticker, score: r.score }));
  if (data.length < 5) return null;
  return (
    <div className="glass p-4 mb-6">
      <div className="flex justify-between items-baseline mb-1 flex-wrap gap-1">
        <span className="text-ink text-[13px]">Valuation map</span>
        <span className="text-dim text-[11px]">Fast growth at a low multiple sits bottom-right. Brighter = higher fit score.</span>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 16, bottom: 18, left: 0 }}>
            <CartesianGrid stroke="rgb(var(--color-line))" strokeOpacity={0.4} />
            <XAxis type="number" dataKey="x" name="Growth" unit="%" tick={{ fontSize: 10, fill: "rgb(var(--color-dim))" }} tickLine={false}
              label={{ value: "Revenue growth", position: "insideBottom", offset: -8, fontSize: 10, fill: "rgb(var(--color-dim))" }} />
            <YAxis type="number" dataKey="y" name="EV/Rev" unit="x" tick={{ fontSize: 10, fill: "rgb(var(--color-dim))" }} tickLine={false} width={36} />
            <ZAxis type="number" dataKey="z" range={[30, 420]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
              const d = payload?.[0]?.payload; if (!d) return null;
              return <div className="glass px-3 py-2 text-[11px] text-ink"><div className="font-semibold">{d.ticker}</div>
                <div className="text-dim">Growth {d.x}% - EV/Rev {d.y}x</div><div className="text-dim">{fmtMoney(d.z)} - score {Math.round(d.score)}</div></div>;
            }} />
            <Scatter data={data} isAnimationActive animationDuration={900}
              shape={(p: { cx?: number; cy?: number; payload?: { score: number; z: number }; size?: number }) => {
                const s = Math.max(0, Math.min(1, (p.payload?.score ?? 0) / 100));
                return <circle cx={p.cx} cy={p.cy} r={Math.sqrt((p.size ?? 60) / Math.PI)} fill="rgb(var(--color-signal))" fillOpacity={0.15 + s * 0.65} stroke="rgb(var(--color-signal))" strokeOpacity={0.9} />;
              }} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
