"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { fmtMoney } from "@/lib/format";

export function RevenueChart({ history }: { history: { year: number; revenue: number }[] }) {
  if (!history || history.length < 2) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="border border-line p-5"
    >
      <div className="text-dim text-[11px] mb-4">Revenue history</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={history} margin={{ left: 0, right: 10 }}>
          <XAxis dataKey="year" stroke="rgb(var(--color-dim))" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: "rgb(var(--color-line))" }} tickLine={false} />
          <YAxis stroke="rgb(var(--color-dim))" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false}
            tickFormatter={(v) => fmtMoney(v, 0)} width={60} />
          <Tooltip
            contentStyle={{ background: "rgb(var(--color-surface))", border: "1px solid rgb(var(--color-line))", fontSize: 12, fontFamily: "var(--font-mono)" }}
            labelStyle={{ color: "rgb(var(--color-ink))" }}
            formatter={(v: number) => [fmtMoney(v), "Revenue"]}
          />
          <Bar dataKey="revenue" fill="rgb(var(--color-signal))" radius={[2, 2, 0, 0]} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}