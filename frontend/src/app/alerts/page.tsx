"use client";
import { useEffect, useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { PageFade } from "@/components/PageFade";
import { AlertRule, MetricRule, getMetricRules, getRules, setMetricRules, setRules } from "@/lib/alerts";
import { SECTOR_ORDER, sectorLabel } from "@/lib/sectors";

export default function AlertsPage() {
  const [rules, setLocal] = useState<AlertRule[]>([]);
  const [ticker, setTicker] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sector, setSector] = useState("");
  const [min, setMin] = useState(0);
  const [mrules, setM] = useState<MetricRule[]>([]);
  const [mt, setMt] = useState(""); const [mm, setMm] = useState<"score" | "price">("score");
  const [mo, setMo] = useState<"above" | "below">("above"); const [mv, setMv] = useState("");
  const [perm, setPerm] = useState<string>("default");

  useEffect(() => {
    setLocal(getRules()); setM(getMetricRules());
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, []);

  const add = () => {
    if (!ticker && !keyword && !sector && !min) return;
    const label = [ticker && ticker.toUpperCase(), sector && sectorLabel(sector), keyword && `"${keyword}"`, min ? `$${min >= 1000 ? min / 1000 + "B" : min + "M"}+` : ""].filter(Boolean).join(" - ");
    const next = [...rules, { id: String(Date.now()), label, ticker: ticker.trim().toUpperCase() || undefined, sector: sector || undefined, keyword: keyword.trim() || undefined, minValueMusd: min || undefined }];
    setLocal(next); setRules(next); setTicker(""); setKeyword(""); setSector(""); setMin(0);
  };
  const addM = () => {
    const v = parseFloat(mv); const t = mt.trim().toUpperCase();
    if (!t || !Number.isFinite(v)) return;
    const next = [...mrules, { id: String(Date.now()), ticker: t, metric: mm, op: mo, value: v }];
    setM(next); setMetricRules(next); setMt(""); setMv("");
  };
  const delM = (id: string) => { const next = mrules.filter((r) => r.id !== id); setM(next); setMetricRules(next); };
  const del = (id: string) => { const next = rules.filter((r) => r.id !== id); setLocal(next); setRules(next); };
  const ask = async () => { if (typeof Notification !== "undefined") setPerm(await Notification.requestPermission()); };

  const input = "bg-surface border border-line rounded-lg px-3 py-2 text-[12px] text-ink outline-none focus:border-signal w-full";
  return (
    <PageFade>
      <h1 className="font-serif text-3xl text-ink mb-1.5">Deal alerts</h1>
      <p className="text-dim text-[12px] mb-6 max-w-2xl">
        Get a pop-up (and an optional browser notification) when a new deal matches a rule. Rules live in this browser and are checked
        every 90 seconds while DealFlow is open in any tab.
      </p>
      <div className="glass p-5 mb-6 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <label className="text-[11px] text-dim">Ticker<input className={input} value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="e.g. NVDA" /></label>
          <label className="text-[11px] text-dim">Keyword in headline<input className={input} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. take-private" /></label>
          <label className="text-[11px] text-dim">Sector
            <select className={input} value={sector} onChange={(e) => setSector(e.target.value)}><option value="">Any</option>{SECTOR_ORDER.map((s) => <option key={s} value={s}>{sectorLabel(s)}</option>)}</select></label>
          <label className="text-[11px] text-dim">Minimum deal size
            <select className={input} value={min} onChange={(e) => setMin(Number(e.target.value))}><option value={0}>Any</option><option value={100}>$100M+</option><option value={1000}>$1B+</option><option value={10000}>$10B+</option></select></label>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={add} className="bg-signal text-bg rounded-lg px-4 py-2 text-[12px] font-semibold focus-ring">Add alert</button>
          {perm !== "granted" && perm !== "unsupported" && (
            <button onClick={ask} className="border border-line rounded-lg px-4 py-2 text-[12px] text-dim hover:text-ink flex items-center gap-1.5"><Bell size={12} />Enable browser notifications</button>
          )}
        </div>
      </div>
      <div className="grid gap-2 max-w-3xl">
        {rules.length === 0 && <p className="text-dim text-[12px]">No alerts yet. Add one above.</p>}
        {rules.map((r) => (
          <div key={r.id} className="glass px-4 py-3 flex items-center justify-between text-[13px] text-ink">
            <span>{r.label}</span>
            <button aria-label={`Remove alert ${r.label}`} onClick={() => del(r.id)} className="text-dim hover:text-down"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <h2 className="font-serif text-xl text-ink mt-10 mb-1.5">Watchlist alerts</h2>
      <p className="text-dim text-[12px] mb-4 max-w-2xl">Get alerted when a company&apos;s fit score or share price crosses a level. Checked every 90 seconds while DealFlow is open.</p>
      <div className="glass p-5 mb-4 max-w-3xl grid sm:grid-cols-4 gap-3 items-end">
        <label className="text-[11px] text-dim">Ticker<input className={input} value={mt} onChange={(e) => setMt(e.target.value)} placeholder="e.g. CRWD" /></label>
        <label className="text-[11px] text-dim">Metric<select className={input} value={mm} onChange={(e) => setMm(e.target.value as "score" | "price")}><option value="score">Fit score</option><option value="price">Share price</option></select></label>
        <label className="text-[11px] text-dim">Condition<select className={input} value={mo} onChange={(e) => setMo(e.target.value as "above" | "below")}><option value="above">Rises to</option><option value="below">Falls to</option></select></label>
        <label className="text-[11px] text-dim">Level<input className={input} inputMode="decimal" value={mv} onChange={(e) => setMv(e.target.value)} placeholder="e.g. 70" /></label>
        <button onClick={addM} className="bg-signal text-bg rounded-lg px-4 py-2 text-[12px] font-semibold focus-ring w-fit">Add watchlist alert</button>
      </div>
      <div className="grid gap-2 max-w-3xl">
        {mrules.map((r) => (
          <div key={r.id} className="glass px-4 py-3 flex items-center justify-between text-[13px] text-ink">
            <span>{r.ticker} {r.metric === "score" ? "fit score" : "price"} {r.op === "above" ? "rises to" : "falls to"} {r.value}</span>
            <button aria-label={`Remove alert ${r.ticker}`} onClick={() => delM(r.id)} className="text-dim hover:text-down"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </PageFade>
  );
}
