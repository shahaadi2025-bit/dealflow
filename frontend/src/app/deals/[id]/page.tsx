"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { PageFade } from "@/components/PageFade";
import { NewsCard } from "@/components/NewsCard";
import { PrecedentsPanel } from "@/components/PrecedentsPanel";
import { api } from "@/lib/api";
import { fmtMoney, fmtPct, fmtX } from "@/lib/format";
import { sectorLabel } from "@/lib/sectors";
import { fmtDealValue, timeAgo } from "@/lib/time";

export default function DealPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({ queryKey: ["deal", id], queryFn: () => api.dealItem(id), retry: false, staleTime: 120_000 });
  const d = q.data;
  return (
    <PageFade>
      <Link href="/deals" className="text-dim text-[12px] hover:text-signal inline-flex items-center gap-1 mb-4"><ArrowLeft size={12} /> Deal wire</Link>
      {q.isLoading && <div className="shimmer h-40 rounded-xl" />}
      {q.isError && <><h1 className="font-serif text-2xl text-ink mb-2">Deal not found</h1><p className="text-dim text-[13px]">This deal is no longer in the archive or the live wire.</p></>}
      {d && (
        <>
          <div className="flex flex-wrap gap-2 items-center mb-3 text-[11px]">
            {d.deal.status && <span className="border border-signal text-signal px-1.5 py-0.5 capitalize">{d.deal.status}</span>}
            {d.deal.type && <span className="text-dim">{d.deal.type}</span>}
            {d.deal.sectors.map((s) => <Link key={s} href={`/sector/${s}`} className="text-dim hover:text-signal">{sectorLabel(s)}</Link>)}
            <span className="text-dim ml-auto">{timeAgo(d.deal.published)}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-ink break-words mb-2 flex flex-wrap items-center gap-2">
            {d.deal.acquirer && d.deal.target ? (<><span>{d.deal.acquirer}</span><ArrowRight className="text-signal" size={22} /><span>{d.deal.target}</span></>) : d.deal.title}
          </h1>
          <a href={d.deal.link} target="_blank" rel="noopener noreferrer" className="text-dim text-[12px] hover:text-signal inline-flex gap-1.5 items-start mb-6">
            <span>{d.deal.title}</span><ExternalLink size={11} className="mt-0.5 shrink-0" /></a>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Cell label="Reported value" value={fmtDealValue(d.deal.value_musd) ?? "Undisclosed"} />
            <Cell label="Source" value={d.deal.source ?? "-"} />
            <Cell label="Implied EV / Revenue" value={d.implied ? fmtX(d.implied.ev_rev) : "-"} />
            <Cell label="Premium to market cap" value={d.implied?.premium_to_market_cap != null ? fmtPct(d.implied.premium_to_market_cap) : "-"} />
          </div>
          {d.implied && (
            <p className="text-[12.5px] text-ink leading-relaxed mb-6 max-w-2xl">
              At {fmtMoney(d.implied.deal_value)} the price is {fmtX(d.implied.ev_rev)} {d.implied.name}&apos;s trailing revenue
              {d.implied.ev_ebitda ? ` and ${fmtX(d.implied.ev_ebitda)} EBITDA` : ""}. Implied from a headline value and the latest snapshot, so treat it as an estimate.
            </p>
          )}
          {d.tickers.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2 items-center text-[12px]">
              <span className="text-dim">Tracked companies:</span>
              {d.tickers.map((t) => <Link key={t} href={`/company/${t}`} className="border border-line px-2 py-1 text-ink hover:border-signal">{t}</Link>)}
            </div>
          )}
          <div className="grid lg:grid-cols-2 gap-6">
            <PrecedentsPanel sector={d.deal.sectors[0]} />
            <section>
              <div className="text-dim text-[11px] mb-2">Related coverage</div>
              <div className="space-y-3">
                {d.related.length === 0 && <p className="text-dim text-[12px]">No other recent coverage found.</p>}
                {d.related.slice(0, 5).map((n) => <NewsCard key={n.link} item={n} compact />)}
              </div>
            </section>
          </div>
        </>
      )}
    </PageFade>
  );
}
function Cell({ label, value }: { label: string; value: string }) {
  return <div className="glass px-3 py-2.5"><div className="text-dim text-[10.5px]">{label}</div><div className="font-serif text-lg text-ink tabular-nums break-words">{value}</div></div>;
}
