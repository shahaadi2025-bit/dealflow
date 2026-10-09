"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtMoney, fmtPct, fmtPrice, fmtX } from "@/lib/format";

const ROWS: { label: string; get: (c: any) => string }[] = [
  { label: "Price", get: (c) => fmtPrice(c.price) },
  { label: "Market cap", get: (c) => fmtMoney(c.market_cap) },
  { label: "Revenue (LTM)", get: (c) => fmtMoney(c.revenue) },
  { label: "Revenue growth", get: (c) => fmtPct(c.rev_growth) },
  { label: "Gross margin", get: (c) => fmtPct(c.gross_margin) },
  { label: "FCF margin", get: (c) => fmtPct(c.fcf_margin) },
  { label: "EBITDA margin", get: (c) => fmtPct(c.ebitda_margin) },
  { label: "Net debt", get: (c) => fmtMoney(c.net_debt) },
  { label: "Enterprise value", get: (c) => fmtMoney(c.ev) },
  { label: "EV / Revenue", get: (c) => (c.revenue ? fmtX(c.ev / c.revenue) : "-") },
  { label: "Beta", get: (c) => (c.beta != null ? c.beta.toFixed(2) : "-") },
  { label: "52-week range", get: (c) => (c.lo52 && c.hi52 ? `${fmtPrice(c.lo52)} - ${fmtPrice(c.hi52)}` : "-") },
];

export default function ComparePage() {
  return (
    <Suspense fallback={<p className="text-dim py-12">Loading...</p>}>
      <CompareInner />
    </Suspense>
  );
}

function CompareInner() {
  const params = useSearchParams();
  const tickers = (params.get("tickers") || "").split(",").filter(Boolean);

  const results = useQueries({
    queries: tickers.map((t) => ({ queryKey: ["company", t], queryFn: () => api.company(t) })),
  });

  const loading = results.some((r) => r.isLoading);
  const companies = results.map((r) => r.data).filter(Boolean) as any[];

  if (tickers.length === 0) {
    return <p className="text-dim py-12">No tickers selected. Go back to the screener and check a few rows to compare.</p>;
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink mb-2">Comparison</h1>
      <p className="text-dim text-[12px] mb-8">{tickers.join(" - ")}</p>

      {loading && <p className="text-dim py-12">Loading companies...</p>}

      {!loading && companies.length > 0 && (
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left text-dim text-[11px] font-normal py-3 pr-8">Metric</th>
                {companies.map((c) => (
                  <th key={c.ticker} className="text-right py-3 pr-8">
                    <Link href={`/company/${c.ticker}`} className="focus-ring">
                      <div className="text-ink text-[14px] hover:text-signal transition-colors">{c.ticker}</div>
                      <div className="text-dim text-[10px] font-normal">{c.name}</div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-line/60">
                  <td className="py-2.5 pr-8 text-dim text-[12px]">{row.label}</td>
                  {companies.map((c) => (
                    <td key={c.ticker} className="py-2.5 pr-8 text-right text-ink tabular-nums text-[12px]">
                      {row.get(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}