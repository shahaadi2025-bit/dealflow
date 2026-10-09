"use client";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { NewsItem } from "@/lib/api";
import { sectorLabel } from "@/lib/sectors";
import { fmtDealValue, timeAgo } from "@/lib/time";

const STATUS_STYLE: Record<string, string> = {
  announced: "border-signal text-signal",
  rumor: "border-line text-dim",
  completed: "border-up text-up",
  terminated: "border-down text-down",
};

export function DealCard({ item, isNew = false }: { item: NewsItem; isNew?: boolean }) {
  const d = item.deal;
  if (!d) return null;
  const value = fmtDealValue(d.value_musd);
  return (
    <article className={`glow-card glass p-4 ${isNew ? "flash-new" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        <span className={`text-[10.5px] border px-1.5 py-0.5 capitalize ${STATUS_STYLE[d.status]}`}>{d.status}</span>
        <span className="text-[10.5px] text-dim">{d.type}</span>
        {value && <span className="text-[11px] text-ink border border-line px-1.5 py-0.5 tabular-nums">{value}</span>}
        {isNew && <span className="text-[10.5px] text-signal border border-signal/40 px-1 rounded">NEW</span>}
        <span className="ml-auto text-[11px] text-dim">{timeAgo(item.published)}</span>
      </div>
      {d.acquirer && d.target && (
        <div className="flex items-center gap-2 mb-2 font-serif text-[16px] text-ink flex-wrap">
          <span>{d.acquirer}</span><ArrowRight size={14} className="text-signal shrink-0" /><span>{d.target}</span>
        </div>
      )}
      <a href={item.link} target="_blank" rel="noopener noreferrer"
        className={`inline-flex items-start gap-1.5 hover:text-signal transition-colors ${d.acquirer ? "text-dim text-[12px]" : "text-ink text-[13.5px]"} leading-snug`}>
        <span>{item.title}</span><ExternalLink size={11} className="mt-0.5 shrink-0 opacity-50" />
      </a>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-[11px] text-dim">
        <span className="text-ink/80">{item.source}</span>
        {item.also_reported_by.length > 0 && <span title={item.also_reported_by.join(", ")}>+{item.also_reported_by.length} outlets</span>}
        {item.sectors.slice(0, 2).map((s) => (
          <Link key={s} href={`/screener?sector=${s}`} className="hover:text-ink">{sectorLabel(s)}</Link>
        ))}
        {item.tickers.map((t) => (
          <Link key={t} href={`/company/${t}`} className="text-[10.5px] border border-signal/50 text-signal px-1.5 py-0.5 hover:bg-signal hover:text-bg transition-colors">{t}</Link>
        ))}
      </div>
    </article>
  );
}
