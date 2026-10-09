"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Search, Flame } from "lucide-react";
import { api, NewsItem } from "@/lib/api";
import { SECTOR_ORDER, sectorLabel } from "@/lib/sectors";
import { getPipeline } from "@/lib/pipeline";
import { NewsCard } from "@/components/NewsCard";
import { LiveBadge } from "@/components/LiveBadge";
import { PageFade } from "@/components/PageFade";

type Tab = "market" | "pipeline";
const SENTIMENTS = ["all", "bullish", "neutral", "bearish"] as const;

export default function NewsPage() {
  const [tab, setTab] = useState<Tab>("market");
  const [sector, setSector] = useState("");
  const [sentiment, setSentiment] = useState<(typeof SENTIMENTS)[number]>("all");
  const [dealsOnly, setDealsOnly] = useState(false);
  const [q, setQ] = useState("");
  const [auto, setAuto] = useState(true);
  const [pipeTickers, setPipeTickers] = useState<string[]>([]);

  useEffect(() => { setPipeTickers(getPipeline().map((p) => p.ticker).slice(0, 8)); }, []);

  const market = useQuery({
    queryKey: ["news-market", sector, sentiment, dealsOnly, q],
    queryFn: () => api.newsMarket({ limit: 80, sector, sentiment: sentiment === "all" ? undefined : sentiment, deals_only: dealsOnly, q: q.trim() || undefined }),
    refetchInterval: auto ? 60_000 : false,
    staleTime: 20_000,
    enabled: tab === "market",
    placeholderData: (prev) => prev,
  });
  const trending = useQuery({ queryKey: ["news-trending"], queryFn: () => api.newsTrending(), refetchInterval: auto ? 120_000 : false, staleTime: 60_000 });

  const pipeQueries = useQueries({
    queries: pipeTickers.map((t) => ({
      queryKey: ["news-ticker", t], queryFn: () => api.newsTicker(t),
      refetchInterval: auto ? 120_000 : (false as const), staleTime: 60_000, enabled: tab === "pipeline",
    })),
  });
  const pipeItems: NewsItem[] = useMemo(() => {
    const seen = new Set<string>();
    const all = pipeQueries.flatMap((r) => r.data?.items ?? []).filter((i) => (seen.has(i.link) ? false : (seen.add(i.link), true)));
    return all.sort((a, b) => (b.published || "").localeCompare(a.published || ""));
  }, [pipeQueries]);

  const marketItems = market.data?.items;
  const items = useMemo(() => (tab === "market" ? marketItems ?? [] : pipeItems), [tab, marketItems, pipeItems]);
  const updated = tab === "market" ? market.data?.updated : pipeQueries.find((r) => r.data)?.data?.updated;
  const fetching = tab === "market" ? market.isFetching : pipeQueries.some((r) => r.isFetching);

  // highlight links that were not in the previous refresh
  const seenRef = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    const links = new Set(items.map((i) => i.link));
    if (seenRef.current && links.size > 0) {
      const added = new Set([...links].filter((l) => !seenRef.current!.has(l)));
      if (added.size > 0 && added.size < links.size) {
        setFresh(added);
        const id = setTimeout(() => setFresh(new Set()), 8000);
        seenRef.current = links;
        return () => clearTimeout(id);
      }
    }
    if (links.size > 0) seenRef.current = links;
  }, [items]);
  useEffect(() => { seenRef.current = null; }, [tab, sector, sentiment, dealsOnly, q]);

  const mood = market.data?.mood;
  const total = mood ? mood.bullish + mood.bearish + mood.neutral : 0;

  return (
    <PageFade>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-ink mb-1.5">Market news</h1>
          <p className="text-dim text-[12px] max-w-xl">
            Headlines from Yahoo Finance, CNBC, MarketWatch and Google News, tagged by company, sector and tone.
            Refreshes every minute.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-[11px] text-dim cursor-pointer">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[rgb(var(--color-signal))]" />
            Auto-refresh
          </label>
          <LiveBadge updated={updated} fetching={fetching} live={auto} onRefresh={() => (tab === "market" ? market.refetch() : pipeQueries.forEach((r) => r.refetch()))} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex border border-line">
          {(["market", "pipeline"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3.5 py-2 text-[12px] transition-colors focus-ring ${tab === t ? "bg-signal text-bg" : "text-dim hover:text-ink"}`}>
              {t === "market" ? "Market" : `My pipeline${pipeTickers.length ? ` (${pipeTickers.length})` : ""}`}
            </button>
          ))}
        </div>
        {tab === "market" && (
          <>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by word or ticker"
                className="bg-transparent border border-line pl-7 pr-2 py-2 text-[12px] w-52 outline-none focus:border-signal transition-colors" />
            </div>
            <select value={sector} onChange={(e) => setSector(e.target.value)}
              className="bg-surface border border-line px-2 py-2 text-[12px] text-ink outline-none focus:border-signal">
              <option value="">All sectors</option>
              {SECTOR_ORDER.map((s) => <option key={s} value={s}>{sectorLabel(s)}</option>)}
            </select>
            <div className="flex border border-line">
              {SENTIMENTS.map((s) => (
                <button key={s} onClick={() => setSentiment(s)}
                  className={`px-3 py-2 text-[12px] capitalize transition-colors focus-ring ${sentiment === s ? "bg-surface text-ink" : "text-dim hover:text-ink"}`}>
                  {s}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-[12px] text-dim cursor-pointer">
              <input type="checkbox" checked={dealsOnly} onChange={(e) => setDealsOnly(e.target.checked)} className="accent-[rgb(var(--color-signal))]" />
              M&amp;A only
            </label>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3 min-w-0">
          {tab === "pipeline" && pipeTickers.length === 0 && (
            <div className="glass p-6 text-[12px] text-dim">
              Your pipeline is empty. Add companies from the <Link href="/screener" className="text-signal hover:underline">screener</Link> and their news appears here.
            </div>
          )}
          {(tab === "market" ? market.isLoading : pipeQueries.some((r) => r.isLoading)) && items.length === 0 && (
            <>{[0, 1, 2, 3, 4].map((i) => <div key={i} className="shimmer h-24" />)}</>
          )}
          {market.isError && tab === "market" && (
            <div className="glass p-6 text-[12px] text-down">News feeds could not be reached. The page retries automatically.</div>
          )}
          {!market.isLoading && !market.isError && tab === "market" && items.length === 0 && (
            <div className="glass p-6 text-[12px] text-dim">No headlines match these filters. Clear a filter or wait for the next refresh.</div>
          )}
          {items.map((it) => <NewsCard key={it.link} item={it} isNew={fresh.has(it.link)} />)}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 self-start">
          {tab === "market" && mood && total > 0 && (
            <div className="glass p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-ink text-[12px]">Headline tone</h3>
                <span className={`text-[12px] capitalize ${mood.label === "bullish" ? "text-up" : mood.label === "bearish" ? "text-down" : "text-dim"}`}>{mood.label}</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-sm bg-line/50">
                <div className="bg-up" style={{ width: `${(mood.bullish / total) * 100}%` }} />
                <div className="bg-dim/40" style={{ width: `${(mood.neutral / total) * 100}%` }} />
                <div className="bg-down" style={{ width: `${(mood.bearish / total) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[10.5px] text-dim mt-2 tabular-nums">
                <span>{mood.bullish} bullish</span><span>{mood.neutral} neutral</span><span>{mood.bearish} bearish</span>
              </div>
              <p className="text-dim text-[10.5px] mt-3 leading-relaxed">
                Keyword-based tone of headlines, not a price forecast.
              </p>
            </div>
          )}
          <div className="glass p-4">
            <h3 className="text-ink text-[12px] mb-3 flex items-center gap-1.5"><Flame size={13} className="text-signal" /> Trending tickers</h3>
            {trending.isLoading && <div className="shimmer h-16" />}
            {trending.data && trending.data.tickers.length === 0 && <p className="text-dim text-[11px]">Not enough mentions yet.</p>}
            <div className="space-y-1.5">
              {trending.data?.tickers.map((t) => (
                <Link key={t.ticker} href={`/company/${t.ticker}`} className="flex items-center justify-between text-[12px] hover:text-signal transition-colors">
                  <span className="text-ink">{t.ticker}</span>
                  <span className="flex items-center gap-2 text-dim tabular-nums">
                    <span className={t.sentiment > 0.1 ? "text-up" : t.sentiment < -0.1 ? "text-down" : ""}>{t.sentiment > 0.1 ? "up tone" : t.sentiment < -0.1 ? "down tone" : "mixed"}</span>
                    {t.mentions}x
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="glass p-4 text-[11px] text-dim leading-relaxed">
            Want only acquisitions? See the <Link href="/deals" className="text-signal hover:underline">live deal wire</Link>.
          </div>
        </aside>
      </div>
    </PageFade>
  );
}
