"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { NewsCard } from "./NewsCard";
import { LiveBadge } from "./LiveBadge";

export function NewsPanel({ ticker, name }: { ticker: string; name?: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["news-ticker", ticker],
    queryFn: () => api.newsTicker(ticker),
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 1,
  });
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-serif text-xl text-ink">Latest news{name ? ` on ${name}` : ""}</h2>
          {data && data.count > 0 && (
            <p className="text-dim text-[11px] mt-1">
              Tone: <span className={data.mood.label === "bullish" ? "text-up" : data.mood.label === "bearish" ? "text-down" : "text-ink"}>{data.mood.label}</span>
              {" "}({data.mood.bullish} bullish / {data.mood.bearish} bearish of {data.count})
            </p>
          )}
        </div>
        <LiveBadge updated={data?.updated} fetching={isFetching} onRefresh={() => refetch()} />
      </div>
      {isLoading && <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="shimmer h-20" />)}</div>}
      {isError && <p className="text-dim text-[12px]">News feeds are unreachable right now. They refresh automatically.</p>}
      {data && data.count === 0 && !isLoading && (
        <p className="text-dim text-[12px]">No recent headlines found for {ticker}. <Link href="/news" className="text-signal hover:underline">See market news</Link>.</p>
      )}
      {data && data.count > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {data.items.slice(0, 8).map((it) => <NewsCard key={it.link} item={it} compact />)}
        </div>
      )}
    </section>
  );
}
