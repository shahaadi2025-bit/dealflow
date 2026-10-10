"use client";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";

/** Deals detected per day over the last 14 days, from the live wire. */
export function DealVolume() {
  const { data } = useQuery({ queryKey: ["deal-volume"], queryFn: () => api.liveDeals(undefined, 14), staleTime: 120_000, refetchInterval: 120_000, retry: 1 });
  const items = data?.items ?? [];
  if (items.length < 3) return null;
  const days: Record<string, { n: number; v: number }> = {};
  for (let i = 13; i >= 0; i--) days[new Date(Date.now() - i * 864e5).toISOString().slice(5, 10)] = { n: 0, v: 0 };
  items.forEach((it) => { const k = (it.published || "").slice(5, 10); if (days[k]) { days[k].n++; days[k].v += it.deal?.value_musd ?? 0; } });
  const rows = Object.entries(days).map(([d, x]) => ({ d, deals: x.n, value: Math.round(x.v / 1000) }));
  return (
    <div className="glass p-5 mb-5">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-dim text-[11px]">Deals reported per day, last 14 days</span>
        <span className="text-ink text-[12px] tabular-nums">{items.length} total</span>
      </div>
      <div className="h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs><linearGradient id="dv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--color-signal))" stopOpacity={0.5} /><stop offset="100%" stopColor="rgb(var(--color-signal))" stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="d" tick={{ fontSize: 10, fill: "rgb(var(--color-dim))" }} tickLine={false} axisLine={false} interval={2} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "rgb(var(--color-surface))", border: "1px solid rgb(var(--color-line))", borderRadius: 10, fontSize: 12 }}
              formatter={(v: number, k: string) => [k === "deals" ? v : `$${v}B`, k === "deals" ? "Deals" : "Disclosed value"]} />
            <Area type="monotone" dataKey="deals" stroke="rgb(var(--color-signal))" strokeWidth={2} fill="url(#dv)" isAnimationActive animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
