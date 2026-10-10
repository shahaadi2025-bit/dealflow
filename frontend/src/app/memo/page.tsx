"use client";
import { useEffect, useState } from "react";
import { PageFade } from "@/components/PageFade";
import { decodeMemo, SharedMemo } from "@/lib/share";

const SECTIONS: [keyof SharedMemo["memo"], string][] = [
  ["executive_summary", "Executive summary"], ["business_overview", "Business overview"], ["financial_analysis", "Financial analysis"],
  ["valuation_summary", "Valuation summary"], ["key_risks", "Key risks"], ["recommendation", "Recommendation"],
];

export default function SharedMemoPage() {
  const [data, setData] = useState<SharedMemo | null | undefined>(undefined);
  useEffect(() => { setData(decodeMemo(window.location.hash)); }, []);
  if (data === undefined) return <p className="text-dim py-12">Loading...</p>;
  if (!data) return <PageFade><p className="text-dim py-12">This memo link is empty or damaged.</p></PageFade>;
  return (
    <PageFade>
      <article className="max-w-3xl">
        <p className="text-dim text-[11px] mb-1">Shared investment memo</p>
        <h1 className="font-serif text-3xl text-ink mb-8">{data.company}</h1>
        {SECTIONS.map(([k, label]) => data.memo[k] ? (
          <section key={k} className="mb-6">
            <h2 className="font-serif text-lg text-ink mb-2">{label}</h2>
            <p className="text-[13px] leading-relaxed text-ink/90 whitespace-pre-line">{String(data.memo[k])}</p>
          </section>
        ) : null)}
        <p className="text-dim text-[11px] border-t border-line pt-4">Generated with DealFlow from public data. Not investment advice.</p>
      </article>
    </PageFade>
  );
}
