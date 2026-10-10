"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtMoney } from "@/lib/format";

export function PotentialBuyers({ ticker }: { ticker: string }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ["buyers", ticker], queryFn: () => api.buyers(ticker), staleTime: 600_000, retry: false });
  if (isError) return null;
  return (
    <section className="glass p-5" aria-label="Potential acquirers">
      <div className="text-dim text-[11px] mb-1">Potential acquirers</div>
      <p className="text-dim text-[11px] mb-4">Ranked by ability to pay, relative size, sector fit and growth appetite. A screening aid, not a prediction.</p>
      {isLoading && <p className="text-dim text-[12px]">Scanning the universe...</p>}
      {data && data.buyers.length === 0 && <p className="text-dim text-[12px]">No buyer in the tracked universe can plausibly afford this company.</p>}
      <div className="space-y-2">
        {data?.buyers.map((b) => (
          <Link key={b.ticker} href={`/company/${b.ticker}`} className="block rounded-lg px-2 py-2 -mx-2 hover:bg-line/20 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full grid place-items-center text-[12px] tabular-nums border border-signal/50 text-signal shrink-0">{b.score}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-ink group-hover:text-signal transition-colors">{b.ticker}</span>
                  <span className="text-dim text-[11px] truncate">{b.name}</span>
                  <span className="ml-auto text-dim text-[11px] tabular-nums">{fmtMoney(b.market_cap)}</span>
                </div>
                <div className="text-dim text-[11px]">{b.reasons.join(" - ")}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
