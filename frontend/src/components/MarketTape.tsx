"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function MarketTape() {
  const { data } = useQuery({
    queryKey: ["tape"],
    queryFn: () => api.marketTape(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
  const items = data?.items ?? [];
  if (items.length === 0) return null;
  const row = (suffix: string) => items.map((q) => (
    <span key={q.symbol + suffix} className="flex items-center gap-2 px-5 text-[11px] whitespace-nowrap tabular-nums">
      <span className="text-dim">{q.label}</span>
      <span className="text-ink">{q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      <span className={q.change_pct >= 0 ? "text-up" : "text-down"}>
        {q.change_pct >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(q.change_pct).toFixed(2)}%
      </span>
    </span>
  ));
  return (
    <div className="marquee border-t border-line/70 overflow-hidden h-7 flex items-center bg-surface/40" aria-label="Market snapshot">
      <div className="marquee-track">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
