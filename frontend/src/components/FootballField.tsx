"use client";
import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts";
import { motion } from "framer-motion";
import { FootballBar } from "@/lib/api";
import { fmtPrice } from "@/lib/format";

const KIND_COLOR: Record<string, string> = { dcf: "rgb(var(--color-signal))", comps: "rgb(var(--color-violet))", market: "rgb(var(--color-dim))", offer: "rgb(var(--color-up))" };

export function FootballField({ bars, currentPrice }: { bars: FootballBar[]; currentPrice: number }) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 640);
    on(); window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  // Cap the axis at 4x the current price so one extreme multiple cannot flatten every other bar.
  const cap = currentPrice * 4;
  const truncated = bars.some((b) => b.high > cap);
  const data = bars.map((b) => ({ ...b, range: [Math.min(b.low, cap), Math.min(b.high, cap)] }));
  const max = Math.min(Math.max(currentPrice, ...bars.map((b) => b.high)), cap) * 1.1;
  const short = (l: string) => (narrow && l.length > 22 ? l.slice(0, 20) + "..." : l);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="border border-line p-5"
    >
      <div className="text-dim text-[11px] mb-4">Valuation range per share - DCF, comparables, trading range, offer range</div>
      <ResponsiveContainer width="100%" height={data.length * 46 + 40}>
        <BarChart data={data} layout="vertical" margin={{ left: narrow ? 0 : 10, right: 30 }}>
          <XAxis type="number" domain={[0, max]} allowDataOverflow stroke="rgb(var(--color-dim))" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickFormatter={(v) => `$${v.toFixed(0)}`} axisLine={{ stroke: "rgb(var(--color-line))" }} tickLine={false} />
          <YAxis type="category" dataKey="label" width={narrow ? 120 : 230} tickFormatter={short} stroke="rgb(var(--color-dim))"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: "rgb(var(--color-line))" }} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "rgb(var(--color-surface))", border: "1px solid rgb(var(--color-line))", fontSize: 12, fontFamily: "var(--font-mono)" }}
            labelStyle={{ color: "rgb(var(--color-ink))" }}
            formatter={(_: unknown, __: string, p) => {
              const d = bars.find((b) => b.key === (p.payload as FootballBar).key) ?? (p.payload as FootballBar);
              return [`${fmtPrice(d.low)} - ${fmtPrice(d.high)}`, "Range"];
            }}
          />
          <ReferenceLine x={currentPrice} stroke="rgb(var(--color-ink))" strokeDasharray="3 3"
            label={{ value: `Current ${fmtPrice(currentPrice)}`, position: "top", fill: "rgb(var(--color-ink))", fontSize: 11 }} />
          <Bar dataKey="range" barSize={20}>
            {data.map((d, i) => (
              <Cell key={i} fill={KIND_COLOR[d.kind] || "rgb(var(--color-dim))"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {truncated && <p className="text-dim text-[10.5px] mt-1">Bars beyond 4x the current price are cut off so the rest stay readable; hover for the full range.</p>}
    </motion.div>
  );
}