"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtMoney, fmtX, fmtPct } from "@/lib/format";
import { sectorLabel } from "@/lib/sectors";

/** What acquirers have actually paid (deal value / revenue) for tracked companies, from the archived deal wire. */
export function PrecedentsPanel({ ticker, sector }: { ticker?: string; sector?: string }) {
  const q = useQuery({
    queryKey: ["precedents", ticker ?? sector ?? "all"], staleTime: 300_000, retry: false,
    queryFn: () => (ticker ? api.companyPrecedents(ticker) : api.precedents(sector)),
  });
  const data = q.data;
  const extra = (ticker ? data : null) as { company_ev_rev: number | null; implied_ev_at_median: number | null } | null;
  const st = data?.stats;
  return (
    <section className="glass p-5" aria-label="Precedent transactions">
      <div className="text-dim text-[11px] mb-1">Precedent transactions{data?.sector ? ` - ${sectorLabel(data.sector)}` : ""}</div>
      <p className="text-dim text-[11px] mb-4">Prices acquirers paid for tracked public companies, detected from headlines and archived automatically. Best-effort; verify at the source.</p>
      {q.isLoading && <p className="text-dim text-[12px]">Loading...</p>}
      {data && !st && <p className="text-dim text-[12px]">Not enough archived deals with disclosed prices yet. This fills in as the deal collector runs every few hours.</p>}
      {st && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Cell label="Median EV/Revenue paid" value={fmtX(st.median)} />
            <Cell label="Middle half paid" value={`${fmtX(st.p25)} - ${fmtX(st.p75)}`} />
            <Cell label="Deals in sample" value={String(st.n)} />
          </div>
          {extra?.company_ev_rev != null && extra.implied_ev_at_median != null && (
            <p className="text-[12px] text-ink mb-4 leading-relaxed">
              {ticker} trades at {fmtX(extra.company_ev_rev)} revenue today. At the median precedent multiple its enterprise value would be about{" "}
              <span className="text-signal">{fmtMoney(extra.implied_ev_at_median)}</span>.
            </p>
          )}
          <div className="space-y-1.5">
            {data!.items.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center gap-3 text-[12px] border-b border-line/50 py-1.5">
                <span className="tabular-nums text-signal w-14 shrink-0">{fmtX(r.ev_rev)}</span>
                <Link href={`/deals/${r.id}`} className="text-ink hover:text-signal truncate flex-1">{r.acquirer ?? "?"} → {r.name}</Link>
                <span className="text-dim tabular-nums shrink-0">{fmtMoney(r.deal_value)}</span>
                {r.premium_to_market_cap != null && <span className="text-dim shrink-0 hidden sm:inline">{fmtPct(r.premium_to_market_cap)} vs mkt cap</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-line px-3 py-2.5"><div className="text-dim text-[10.5px]">{label}</div><div className="font-serif text-xl text-ink tabular-nums">{value}</div></div>;
}
