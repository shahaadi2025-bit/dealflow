"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts";
import { motion } from "framer-motion";
import { FootballBar } from "@/lib/api";
import { fmtPrice } from "@/lib/format";

const KIND_COLOR: Record<string, string> = { dcf: "#C08A2E", comps: "#7C9CBF", market: "#5C6470", offer: "#4C9A6A" };

export function FootballField({ bars, currentPrice }: { bars: FootballBar[]; currentPrice: number }) {
  const data = bars.map((b) => ({ ...b, range: [b.low, b.high] }));
  const max = Math.max(currentPrice, ...bars.map((b) => b.high)) * 1.1;

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
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis type="number" domain={[0, max]} stroke="#8B94A0" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickFormatter={(v) => `$${v.toFixed(0)}`} axisLine={{ stroke: "#242B33" }} tickLine={false} />
          <YAxis type="category" dataKey="label" width={230} stroke="#8B94A0"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: "#242B33" }} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#12161B", border: "1px solid #242B33", fontSize: 12, fontFamily: "var(--font-mono)" }}
            labelStyle={{ color: "#EDEEF0" }}
            formatter={(_: unknown, __: string, p) => {
              const d = p.payload as FootballBar;
              return [`${fmtPrice(d.low)} - ${fmtPrice(d.high)}`, "Range"];
            }}
          />
          <ReferenceLine x={currentPrice} stroke="#EDEEF0" strokeDasharray="3 3"
            label={{ value: `Current ${fmtPrice(currentPrice)}`, position: "top", fill: "#EDEEF0", fontSize: 11 }} />
          <Bar dataKey="range" barSize={20}>
            {data.map((d, i) => (
              <Cell key={i} fill={KIND_COLOR[d.kind] || "#8B94A0"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}