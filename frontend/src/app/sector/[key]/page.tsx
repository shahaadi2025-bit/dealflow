"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageFade } from "@/components/PageFade";
import { DealCard } from "@/components/DealCard";
import { NewsCard } from "@/components/NewsCard";
import { PrecedentsPanel } from "@/components/PrecedentsPanel";
import { ValuationMap } from "@/components/ValuationMap";
import { api } from "@/lib/api";
import { fmtMoney, fmtPct, fmtX } from "@/lib/format";
import { SECTOR_LABELS } from "@/lib/sectors";

export default function SectorPage() {
  const { key } = useParams<{ key: string }>();
  const label = SECTOR_LABELS[key];
  const stats = useQuery({ queryKey: ["sector-stats"], queryFn: () => api.sectorStats(), staleTime: 600_000 });
  const screen = useQuery({ queryKey: ["screen", key], queryFn: () => api.screen({ sector: key, limit: 60 }), enabled: !!label, staleTime: 300_000 });
  const deals = useQuery({ queryKey: ["deals-live", key, 30], queryFn: () => api.liveDeals(key, 30), enabled: !!label, staleTime: 60_000 });
  const news = useQuery({ queryKey: ["news-sector", key], queryFn: () => api.newsMarket({ sector: key, limit: 6 }), enabled: !!label, staleTime: 60_000 });
  if (!label) return <PageFade><h1 className="font-serif text-2xl text-ink">Unknown sector</h1><Link href="/sectors" className="text-signal text-[13px]">See all sectors</Link></PageFade>;
  const s = stats.data?.sectors.find((x) => x.sector === key);
  const rows = screen.data?.results ?? [];
  return (
    <PageFade>
      <h1 className="font-serif text-3xl text-ink mb-1">{label}</h1>
      <p className="text-dim text-[12px] mb-6">Sector snapshot: typical metrics, top-scoring targets, recent deals and news.</p>
      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {([["Companies", String(s.company_count)], ["Median growth", fmtPct(s.median_growth)], ["Median gross margin", fmtPct(s.median_gross_margin)], ["Median Rule of 40", fmtPct(s.median_rule_of_40)], ["Median EV/Rev", fmtX(s.median_ev_rev)]] as const).map(([l, v]) => (
            <div key={l} className="glass px-3 py-2.5"><div className="text-dim text-[10.5px]">{l}</div><div className="font-serif text-xl text-ink tabular-nums">{v}</div></div>
          ))}
        </div>
      )}
      <ValuationMap rows={rows} />
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <section className="glass p-5">
          <div className="flex justify-between mb-3"><div className="text-dim text-[11px]">Top-scoring targets</div>
            <Link href={`/screener?sector=${key}`} className="text-signal text-[11px] hover:underline">Open in screener</Link></div>
          {screen.isLoading && <div className="shimmer h-24 rounded-lg" />}
          {rows.slice(0, 8).map((r) => (
            <Link key={r.ticker} href={`/company/${r.ticker}`} className="flex items-center gap-3 py-1.5 border-b border-line/50 text-[12px] hover:text-signal">
              <span className="w-14 text-ink font-semibold">{r.ticker}</span><span className="flex-1 truncate text-dim">{r.name}</span>
              <span className="tabular-nums text-dim hidden sm:inline">{fmtMoney(r.market_cap)}</span><span className="tabular-nums text-signal w-8 text-right">{Math.round(r.score)}</span>
            </Link>
          ))}
        </section>
        <PrecedentsPanel sector={key} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <section><div className="text-dim text-[11px] mb-2">Recent deals (30 days)</div>
          <div className="space-y-3">{deals.data?.items.length === 0 && <p className="text-dim text-[12px]">None found.</p>}
            {deals.data?.items.slice(0, 5).map((i) => <DealCard key={i.link} item={i} />)}</div></section>
        <section><div className="text-dim text-[11px] mb-2">Latest news</div>
          <div className="space-y-3">{news.data?.items.slice(0, 5).map((i) => <NewsCard key={i.link} item={i} compact />)}</div></section>
      </div>
    </PageFade>
  );
}
