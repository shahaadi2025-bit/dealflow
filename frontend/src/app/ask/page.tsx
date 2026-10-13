"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { PageFade } from "@/components/PageFade";
import { api } from "@/lib/api";

type Msg = { role: "user" | "bot"; text: string; ai?: boolean; tickers?: string[] };
const EXAMPLES = ["Is CRWD an attractive takeover target?", "What multiples have acquirers paid in cybersecurity?", "Recent deals in semiconductors", "How does NVDA compare on growth and margins?"];

export default function AskPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const question = text.trim();
    if (question.length < 3 || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]); setQ(""); setBusy(true);
    try {
      const r = await api.ask(question);
      const companies = ((r.context as { companies?: { ticker: string }[] }).companies ?? []).map((c) => c.ticker);
      setMsgs((m) => [...m, { role: "bot", text: r.answer, ai: r.ai, tickers: companies }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "bot", text: (e as Error).message || "Something went wrong. Try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <PageFade>
      <h1 className="font-serif text-3xl text-ink mb-1.5">Ask DealFlow</h1>
      <p className="text-dim text-[12px] mb-6 max-w-2xl">Answers come only from DealFlow&apos;s own data (company snapshot, sector medians, the deal archive). It is a research aid, not investment advice.</p>
      <div className="glass p-4 sm:p-5 max-w-3xl">
        <div className="space-y-4 min-h-[200px] mb-4" aria-live="polite">
          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((e) => <button key={e} onClick={() => send(e)} className="border border-line rounded-full px-3 py-1.5 text-[12px] text-dim hover:text-ink hover:border-signal focus-ring text-left">{e}</button>)}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div className={`inline-block max-w-[92%] text-left rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-signal text-bg" : "border border-line text-ink"}`}>{m.text}</div>
              {m.tickers && m.tickers.length > 0 && (
                <div className="mt-1.5 flex gap-2 text-[11px]">{m.tickers.map((t) => <Link key={t} href={`/company/${t}`} className="text-signal hover:underline">Open {t}</Link>)}</div>
              )}
            </div>
          ))}
          {busy && <div className="shimmer h-10 w-48 rounded-xl" />}
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(q); }} className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={400} placeholder="Ask about a company, sector or deal..." aria-label="Your question"
            className="flex-1 bg-surface border border-line rounded-lg px-3 py-2.5 text-[13px] text-ink" />
          <button disabled={busy || q.trim().length < 3} aria-label="Send" className="bg-signal text-bg rounded-lg px-4 disabled:opacity-40 focus-ring"><Send size={15} /></button>
        </form>
      </div>
    </PageFade>
  );
}
