"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { PageFade } from "@/components/PageFade";
import { DealCard } from "@/components/DealCard";
import { LiveBadge } from "@/components/LiveBadge";
import { api } from "@/lib/api";
import { fmtPct, fmtX } from "@/lib/format";
import { SECTOR_ORDER, sectorLabel } from "@/lib/sectors";
import { fmtDealValue, timeAgo } from "@/lib/time";

type Tab = "live" | "filings" | "league" | "comps";
const STATUSES = ["all", "announced", "rumor", "completed", "terminated"] as const;

export default function DealsPage() {
  const [tab, setTab] = useState<Tab>("live");
  return (
    <PageFade>
      <h1 className="font-serif text-3xl text-ink mb-1.5">Deal wire</h1>
      <p className="text-dim text-[12px] mb-6 max-w-2xl">
        M&amp;A headlines across all sectors as they are reported, official SEC filings that signal a deal,
        and the historical comparables behind the scoring model.{" "}
        <Link href="/alerts" className="text-signal hover:underline">Set up deal alerts</Link>
      </p>
      <div className="flex border border-line w-fit mb-6">
        {([["live", "Live deals"], ["filings", "SEC filings"], ["league", "League table"], ["comps", "Comparables"]] as [Tab, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-[12px] transition-colors focus-ring ${tab === k ? "bg-signal text-bg" : "text-dim hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "live" && <LiveDealsTab />}
      {tab === "filings" && <FilingsTab />}
      {tab === "league" && <LeagueTab />}
      {tab === "comps" && <ComparablesTab />}
    </PageFade>
  );
}

function LiveDealsTab() {
  const [sector, setSector] = useState("");
  const [days, setDays] = useState(7);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [minValue, setMinValue] = useState(0);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["deals-live", sector, days],
    queryFn: () => api.liveDeals(sector || undefined, days),
    refetchInterval: 60_000,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });

  const items = (data?.items ?? []).filter((i) =>
    (status === "all" || i.deal?.status === status) && (minValue === 0 || (i.deal?.value_musd ?? 0) >= minValue));

  const seenRef = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => { seenRef.current = null; }, [sector, days]);
  useEffect(() => {
    const links = new Set((data?.items ?? []).map((i) => i.link));
    if (seenRef.current && links.size > 0) {
      const added = new Set([...links].filter((l) => !seenRef.current!.has(l)));
      if (added.size > 0 && added.size < links.size) {
        setFresh(added);
        seenRef.current = links;
        const id = setTimeout(() => setFresh(new Set()), 8000);
        return () => clearTimeout(id);
      }
    }
    if (links.size > 0) seenRef.current = links;
  }, [data]);

  const chart = (data?.stats.by_sector ?? []).slice(0, 8).map((s) => ({ name: sectorLabel(s.sector), count: s.count }));
  const rumors = data?.stats.status?.rumor ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={sector} onChange={(e) => setSector(e.target.value)}
            className="bg-surface border border-line px-2 py-2 text-[12px] text-ink outline-none focus:border-signal">
            <option value="">All sectors</option>
            {SECTOR_ORDER.map((s) => <option key={s} value={s}>{sectorLabel(s)}</option>)}
          </select>
          <div className="flex border border-line">
            {[1, 7, 30].map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-2 text-[12px] transition-colors focus-ring ${days === d ? "bg-surface text-ink" : "text-dim hover:text-ink"}`}>
                {d === 1 ? "24h" : `${d}d`}
              </button>
            ))}
          </div>
          <select value={minValue} onChange={(e) => setMinValue(Number(e.target.value))}
            className="bg-surface border border-line px-2 py-2 text-[12px] text-ink outline-none focus:border-signal">
            <option value={0}>Any size</option>
            <option value={100}>$100M+</option>
            <option value={1000}>$1B+</option>
            <option value={10000}>$10B+</option>
          </select>
        </div>
        <LiveBadge updated={data?.updated} fetching={isFetching} onRefresh={() => refetch()} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-2.5 py-1 text-[11px] border capitalize transition-colors focus-ring ${status === s ? "border-signal text-signal" : "border-line text-dim hover:text-ink"}`}>
            {s}{s !== "all" && data?.stats.status?.[s] ? ` (${data.stats.status[s]})` : ""}
          </button>
        ))}
      </div>

      {data && data.count > 0 && (
        <div className="grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))] mb-6">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass p-4">
            <div className="text-dim text-[11px] mb-1">Deals reported</div>
            <div className="font-serif text-3xl text-ink tabular-nums">{data.count}</div>
            <div className="text-dim text-[11px] mt-1">{rumors} still rumors or talks</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass p-4">
            <div className="text-dim text-[11px] mb-1">Disclosed value</div>
            <div className="font-serif text-3xl text-ink tabular-nums">{fmtDealValue(data.stats.disclosed_value_musd) || "-"}</div>
            <div className="text-dim text-[11px] mt-1">Only deals that state a price</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-3 h-[104px]">
            <div className="text-dim text-[11px] mb-1">Busiest sectors</div>
            <ResponsiveContainer width="100%" height={72}>
              <BarChart data={chart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip cursor={{ fill: "rgb(var(--color-line) / 0.4)" }}
                  contentStyle={{ background: "rgb(var(--color-surface))", border: "1px solid rgb(var(--color-line))", fontSize: 11 }}
                  labelStyle={{ color: "rgb(var(--color-ink))" }} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {chart.map((_, i) => <Cell key={i} fill={i === 0 ? "rgb(var(--color-signal))" : "rgb(var(--color-line))"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {isLoading && <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-28" />)}</div>}
      {isError && <div className="glass p-6 text-[12px] text-down">The deal feeds could not be reached. This page retries every minute.</div>}
      {data && items.length === 0 && !isLoading && (
        <div className="glass p-6 text-[12px] text-dim">No deals match these filters. Try a longer window or clear the size filter.</div>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((it) => <DealCard key={it.link} item={it} isNew={fresh.has(it.link)} />)}
      </div>
      <p className="text-dim text-[11px] mt-6 max-w-2xl leading-relaxed">
        Deals are detected from public headlines, so parties and prices are best-effort. Open the source link to confirm
        before relying on a figure.
      </p>
    </div>
  );
}

function FilingsTab() {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["deal-filings"], queryFn: () => api.dealFilings(), refetchInterval: 120_000, staleTime: 60_000,
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-dim text-[12px] max-w-xl">
          Official SEC EDGAR filings that usually mean a deal is real: tender offers, target responses,
          merger proxies and business-combination communications.
        </p>
        <LiveBadge updated={data?.updated} fetching={isFetching} onRefresh={() => refetch()} />
      </div>
      {isLoading && <div className="space-y-2">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="shimmer h-12" />)}</div>}
      {isError && <div className="glass p-6 text-[12px] text-down">SEC EDGAR could not be reached right now.</div>}
      {data && data.items.length === 0 && !isLoading && <div className="glass p-6 text-[12px] text-dim">No recent filings returned.</div>}
      {data && data.items.length > 0 && (
        <div className="glass overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-line text-dim text-[11px]">
                <th className="text-left font-normal p-3">Filed</th>
                <th className="text-left font-normal p-3">Company</th>
                <th className="text-left font-normal p-3">Form</th>
                <th className="text-left font-normal p-3">Role</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((f, i) => (
                <tr key={f.link + i} className="border-b border-line/50 hover:bg-surface/60 transition-colors">
                  <td className="p-3 text-dim whitespace-nowrap">{timeAgo(f.published)}</td>
                  <td className="p-3 text-ink">{f.company}</td>
                  <td className="p-3"><span className="border border-line px-1.5 py-0.5 text-[10.5px]">{f.form}</span> <span className="text-dim text-[11px] ml-1">{f.form_label}</span></td>
                  <td className="p-3 text-dim">{f.role || ""}</td>
                  <td className="p-3 text-right">
                    <a href={f.link} target="_blank" rel="noopener noreferrer" className="text-signal hover:underline inline-flex items-center gap-1">
                      View <ExternalLink size={10} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ComparablesTab() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["deals"], queryFn: () => api.deals() });
  return (
    <div>
      <p className="text-dim text-[12px] mb-6 max-w-2xl">
        The historical acquisitions used to train the experimental ML scoring model. A fixed reference set, not a live feed.
        Figures come from SEC filings and press coverage; see the confidence label on each.
      </p>
      {isLoading && <p className="text-dim py-8">Loading...</p>}
      {isError && <p className="text-down py-8">Could not load comparables.</p>}
      {data && (
        <div className="grid gap-3 md:grid-cols-2 max-w-5xl">
          {data.deals.map((d, i) => (
            <motion.div key={d.ticker}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              className="glow-card glass p-4">
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-ink text-[14px]">{d.ticker}</span>
                <span className={`text-[10px] px-1.5 py-0.5 border ${d.confidence === "verified" ? "border-up text-up" : "border-signal text-signal"}`}>{d.confidence}</span>
              </div>
              <p className="text-dim text-[12px] leading-relaxed mb-2">{d.note}</p>
              <div className="flex gap-4 text-[11px] text-dim tabular-nums">
                <span>{fmtX(d.ev_rev)} EV/Revenue</span>
                <span>{fmtPct(d.growth)} growth</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}


function LeagueTab() {
  const [by, setBy] = useState<"acquirer" | "target">("acquirer");
  const hist = useQuery({ queryKey: ["deal-history"], queryFn: () => api.dealsHistory(), staleTime: 300_000 });
  const league = useQuery({ queryKey: ["deal-league", by], queryFn: () => api.dealsLeague(by), staleTime: 300_000 });
  const total = hist.data?.summary.total ?? 0;
  const max = Math.max(1, ...(league.data?.rows ?? []).map((r) => r.value_musd || r.count));
  return (
    <div>
      <p className="text-dim text-[12px] mb-4 max-w-2xl">
        Every deal the wire has detected is archived automatically every few hours, building a searchable record over time.
        {total > 0 ? ` ${total} deals archived so far.` : " The archive fills as the collector runs."}
      </p>
      <div className="flex border border-line w-fit mb-4">
        {(["acquirer", "target"] as const).map((k) => (
          <button key={k} onClick={() => setBy(k)} aria-pressed={by === k}
            className={`px-4 py-2 text-[12px] capitalize focus-ring ${by === k ? "bg-surface text-ink" : "text-dim hover:text-ink"}`}>Top {k}s</button>
        ))}
      </div>
      {league.data && league.data.rows.length === 0 && <div className="glass p-6 text-[12px] text-dim">No archived deals with named parties yet.</div>}
      <div className="grid gap-2 mb-8">
        {league.data?.rows.map((r, i) => (
          <div key={r.name} className="glass p-3 flex items-center gap-3">
            <span className="text-dim text-[11px] w-5 tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2 text-[13px]"><span className="text-ink truncate">{r.name}</span>
                <span className="text-dim tabular-nums shrink-0">{r.count} deal{r.count > 1 ? "s" : ""}{r.value_musd ? ` - ${fmtDealValue(r.value_musd)}` : ""}</span></div>
              <div className="h-1.5 mt-1.5 rounded-full bg-line/40 overflow-hidden"><div className="h-full rounded-full bg-signal" style={{ width: `${((r.value_musd || r.count) / max) * 100}%` }} /></div>
            </div>
          </div>
        ))}
      </div>
      {hist.data && hist.data.items.length > 0 && (
        <div className="glass overflow-x-auto">
          <table className="w-full min-w-[560px] text-[12px]"><thead><tr className="text-dim text-[11px] border-b border-line">
            <th className="text-left font-normal p-3">Date</th><th className="text-left font-normal p-3">Deal</th><th className="text-left font-normal p-3">Status</th><th className="text-right font-normal p-3">Value</th></tr></thead>
            <tbody>{hist.data.items.slice(0, 60).map((d) => (
              <tr key={d.id} className="border-b border-line/50"><td className="p-3 text-dim whitespace-nowrap">{(d.published || "").slice(0, 10)}</td>
                <td className="p-3"><a href={d.link} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-signal">{d.acquirer && d.target ? `${d.acquirer} \u2192 ${d.target}` : d.title}</a></td>
                <td className="p-3 text-dim capitalize">{d.status}</td><td className="p-3 text-right tabular-nums">{fmtDealValue(d.value_musd)}</td></tr>))}</tbody></table>
        </div>
      )}
    </div>
  );
}
