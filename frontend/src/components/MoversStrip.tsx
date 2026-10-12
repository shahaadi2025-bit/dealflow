"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function MoversStrip() {
  const { data } = useQuery({ queryKey: ["movers"], queryFn: () => api.movers(), refetchInterval: 120_000, staleTime: 60_000, retry: 1 });
  if (!data || (data.gainers.length === 0 && data.losers.length === 0)) return null;
  const Col = ({ title, rows, up }: { title: string; rows: typeof data.gainers; up: boolean }) => (
    <div className="glass p-4">
      <div className="text-dim text-[11px] mb-2">{title}</div>
      <div className="space-y-1">
        {rows.map((r) => (
          <Link key={r.ticker} href={`/company/${r.ticker}`} className="flex justify-between text-[12.5px] hover:text-signal">
            <span className="text-ink">{r.ticker}</span>
            <span className="tabular-nums text-dim">${r.price.toFixed(2)}</span>
            <span className={`tabular-nums ${up ? "text-up" : "text-down"} w-16 text-right`}>{up ? "▲" : "▼"} {Math.abs(r.change_pct).toFixed(2)}%</span>
          </Link>
        ))}
      </div>
    </div>
  );
  return (
    <section className="mb-20" aria-label="Market movers">
      <h2 className="font-serif text-2xl sm:text-3xl text-ink mb-4">Biggest movers today</h2>
      <div className="grid gap-3 sm:grid-cols-2"><Col title="Top gainers" rows={data.gainers} up /><Col title="Top losers" rows={data.losers} up={false} /></div>
      <p className="text-dim text-[10.5px] mt-2">Large-cap basket, last session versus the one before.</p>
    </section>
  );
}
