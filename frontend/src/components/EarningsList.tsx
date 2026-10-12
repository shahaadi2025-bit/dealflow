"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { api } from "@/lib/api";

export function EarningsList({ tickers }: { tickers: string[] }) {
  const key = tickers.slice().sort().join(",");
  const { data } = useQuery({ queryKey: ["earnings", key], queryFn: () => api.earnings(tickers.slice(0, 20)), enabled: tickers.length > 0, staleTime: 3_600_000, retry: false });
  if (!data || data.items.length === 0) return null;
  return (
    <section className="glass p-5 mb-6" aria-label="Upcoming earnings">
      <div className="text-dim text-[11px] mb-3 flex items-center gap-1.5"><CalendarClock size={12} /> Upcoming earnings for your pipeline</div>
      <div className="flex flex-wrap gap-2">
        {data.items.map((e) => (
          <Link key={e.ticker} href={`/company/${e.ticker}`} className="rounded-xl border border-line px-3 py-2 hover:border-signal transition-colors">
            <div className="text-ink text-[13px]">{e.ticker}</div>
            <div className="text-dim text-[11px] tabular-nums">{e.date} - {e.days === 0 ? "today" : e.days === 1 ? "tomorrow" : `in ${e.days}d`}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
