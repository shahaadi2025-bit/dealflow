"use client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { NewsItem } from "@/lib/api";
import { sectorLabel } from "@/lib/sectors";
import { timeAgo } from "@/lib/time";

const SENT: Record<string, string> = {
  bullish: "bg-up", bearish: "bg-down", neutral: "bg-dim/50",
};

export function NewsCard({ item, isNew = false, compact = false }: { item: NewsItem; isNew?: boolean; compact?: boolean }) {
  return (
    <article className={`glow-card glass p-4 ${isNew ? "flash-new" : ""}`}>
      <div className="flex items-start gap-3">
        <span
          title={`${item.sentiment.label} tone`}
          className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${SENT[item.sentiment.label]}`}
        />
        <div className="min-w-0 flex-1">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink text-[13.5px] leading-snug hover:text-signal transition-colors inline-flex items-start gap-1.5"
          >
            <span>{item.title}</span>
            <ExternalLink size={11} className="mt-1 shrink-0 opacity-50" />
          </a>
          {!compact && item.summary && item.summary.toLowerCase() !== item.title.toLowerCase() && (
            <p className="text-dim text-[12px] leading-relaxed mt-1.5 line-clamp-2">{item.summary}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-[11px] text-dim">
            <span className="text-ink/80">{item.source}</span>
            <span>{timeAgo(item.published)}</span>
            {item.also_reported_by.length > 0 && (
              <span title={item.also_reported_by.join(", ")}>+{item.also_reported_by.length} outlets</span>
            )}
            {isNew && <span className="text-signal border border-signal/40 px-1 rounded">NEW</span>}
          </div>
          {(item.tickers.length > 0 || item.tags.length > 0 || (!compact && item.sectors.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {item.tickers.map((t) => (
                <Link key={t} href={`/company/${t}`} className="text-[10.5px] border border-signal/50 text-signal px-1.5 py-0.5 hover:bg-signal hover:text-bg transition-colors">
                  {t}
                </Link>
              ))}
              {item.tags.map((t) => (
                <span key={t} className={`text-[10.5px] border px-1.5 py-0.5 ${t === "M&A" ? "border-up/60 text-up" : "border-line text-dim"}`}>{t}</span>
              ))}
              {!compact && item.sectors.slice(0, 2).map((s) => (
                <Link key={s} href={`/screener?sector=${s}`} className="text-[10.5px] text-dim hover:text-ink px-1.5 py-0.5">
                  {sectorLabel(s)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
