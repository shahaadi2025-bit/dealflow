"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Heuristic 0-100 "how attractive a target is" with the reasons behind it. */
export function TakeoverScore({ ticker }: { ticker: string }) {
  const q = useQuery({ queryKey: ["takeover", ticker], queryFn: () => api.takeover(ticker), staleTime: 300_000, retry: false });
  const d = q.data;
  if (!d || d.score == null) return null;
  const tone = d.score >= 65 ? "text-up" : d.score >= 45 ? "text-signal" : "text-dim";
  return (
    <section className="glass p-5" aria-label="Takeover attractiveness">
      <div className="text-dim text-[11px] mb-1">Takeover attractiveness</div>
      <div className="flex items-baseline gap-2 mb-3"><span className={`font-serif text-4xl tabular-nums ${tone}`}>{d.score}</span><span className="text-dim text-[12px]">/ 100 (heuristic, not a prediction)</span></div>
      <div className="space-y-2">
        {d.factors.map((f) => (
          <div key={f.name}>
            <div className="flex justify-between text-[11px]"><span className="text-ink">{f.name}</span><span className="text-dim">{f.note}</span></div>
            <div className="h-1.5 rounded bg-line/60 mt-1"><div className="h-full rounded bg-signal" style={{ width: `${Math.round(f.value * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}
