"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time";

const KINDS = [
  { id: "insider", label: "Insider trades", hint: "Form 4: directors and officers buying or selling their own stock." },
  { id: "activist", label: "Activist stakes", hint: "Schedule 13D: someone who bought 5%+ and may push for change or a sale." },
  { id: "passive", label: "Large holders", hint: "Schedule 13G: passive 5%+ holders." },
] as const;

export function SignalsPanel({ ticker }: { ticker: string }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("insider");
  const q = useQuery({ queryKey: ["filings", ticker, kind], queryFn: () => api.companyFilings(ticker, kind), staleTime: 600_000, retry: false });
  const hint = KINDS.find((k) => k.id === kind)!.hint;
  return (
    <section className="glass p-5" aria-label="Insider and ownership signals">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <div className="text-dim text-[11px]">Insider and ownership signals (SEC EDGAR)</div>
        <div className="flex gap-1" role="group" aria-label="Filing type">
          {KINDS.map((k) => (
            <button key={k.id} onClick={() => setKind(k.id)} aria-pressed={kind === k.id}
              className={`px-2.5 py-1 text-[11px] rounded-full focus-ring ${kind === k.id ? "bg-signal text-bg" : "text-dim hover:text-ink border border-line"}`}>{k.label}</button>
          ))}
        </div>
      </div>
      <p className="text-dim text-[11px] mb-3">{hint}</p>
      {q.isLoading && <div className="shimmer h-16 rounded-lg" />}
      {q.isError && <p className="text-dim text-[12px]">SEC EDGAR could not be reached right now.</p>}
      {q.data && q.data.items.length === 0 && <p className="text-dim text-[12px]">No recent filings of this type.</p>}
      <div className="space-y-1">
        {q.data?.items.slice(0, 8).map((f) => (
          <a key={f.link} href={f.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[12px] py-1.5 border-b border-line/50 hover:text-signal">
            <span className="text-dim w-16 shrink-0 tabular-nums">{timeAgo(f.published) || (f.published ?? "").slice(0, 10)}</span>
            <span className="text-ink truncate flex-1">{f.title}</span>
            <ExternalLink size={11} className="opacity-50 shrink-0" />
          </a>
        ))}
      </div>
    </section>
  );
}
