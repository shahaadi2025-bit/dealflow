"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Radio, Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SECTOR_ORDER, SECTOR_LABELS, SECTOR_BLURBS } from "@/lib/sectors";
import { fmtDealValue, timeAgo } from "@/lib/time";
import { CandleField } from "@/components/CandleField";
import { SectorHeatmap } from "@/components/SectorHeatmap";
import { DealVolume } from "@/components/DealVolume";
import { ScoreRing } from "@/components/ScoreRing";
import { SectorIcon, sectorHue } from "@/components/SectorIcon";
import { AnimatedNumber } from "@/components/AnimatedNumber";

const FREE_FEATURES = [
  "All 29 sectors, from SaaS and semiconductors to insurance and agriculture",
  "Live M&A deal wire and SEC filings",
  "Market and company news dashboard",
  "Full DCF and comps valuation",
  "AI-generated investment memos",
  "CSV and PDF export",
  "Deal pipeline tracker",
  "Unlimited ticker search",
];

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  return (
    <div className="-mt-2">
      <Hero />
      <Ribbon />
      <Bento />
      <SectorHeatmap />
      <Sectors />
      <LiveWire />
      <HowItWorks />
      <Pricing />
      <FinalCta />
    </div>
  );
}

/* ------------------------------------------------------------------ hero */
function Hero() {
  return (
    <section className="relative -mx-4 sm:-mx-6 px-4 sm:px-6 pt-10 pb-4 sm:pt-16 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[560px] sm:h-[620px] opacity-90 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,#000_35%,transparent_85%)]">
        <CandleField />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] sm:h-[620px] bg-[radial-gradient(ellipse_42%_40%_at_50%_54%,rgb(var(--color-bg)/0.9),rgb(var(--color-bg)/0.55)_55%,transparent_80%)]" />
      <div className="relative mx-auto max-w-4xl text-center pt-24 sm:pt-32 pb-16 sm:pb-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass !rounded-full px-3.5 py-1.5 text-[12px] text-dim mb-7">
          <span className="live-dot" /> Live deal wire across 29 sectors
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
          className="font-serif text-[40px] sm:text-[66px] leading-[1.04] text-ink mb-6">
          Find the target.<br />Price the deal.<br />Beat the headline.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="text-dim text-[16px] sm:text-[17px] leading-relaxed mb-9 max-w-2xl mx-auto">
          DealFlow scores acquisition targets with explainable maths, values them with a full DCF and comps
          workbench, and watches the news and SEC filings so you see a deal while it is still moving.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/screener" className="bg-signal px-7 py-3.5 text-[14px] inline-flex items-center gap-2">
            Open the screener <ArrowRight size={15} />
          </Link>
          <Link href="/deals" className="glass !rounded-full px-7 py-3.5 text-[14px] text-ink hover:border-signal transition-colors inline-flex items-center gap-2">
            <Radio size={15} className="text-signal" /> Watch live deals
          </Link>
        </motion.div>
        <p className="text-dim/70 text-[10.5px] mt-10">The chart behind the headline is illustrative, not live data.</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- ribbon */
function Ribbon() {
  const items = [
    { n: SECTOR_ORDER.length, label: "sectors covered", fmt: (v: number) => `${Math.round(v)}` },
    { n: 900, label: "companies screened", fmt: (v: number) => `${Math.round(v)}+` },
    { n: 60, label: "second refresh cycle", fmt: (v: number) => `${Math.round(v)}s` },
    { n: 0, label: "cost during the beta", fmt: () => "$0" },
  ];
  return (
    <motion.section {...reveal} className="glass grid grid-cols-2 md:grid-cols-4 divide-x divide-line/60 mb-20">
      {items.map((it) => (
        <div key={it.label} className="px-5 py-6 text-center">
          <div className="font-serif text-3xl sm:text-4xl text-ink"><AnimatedNumber value={it.n} format={it.fmt} /></div>
          <div className="text-dim text-[12px] mt-1">{it.label}</div>
        </div>
      ))}
    </motion.section>
  );
}

/* ----------------------------------------------------------------- bento */
function Tile({ className = "", title, desc, children, delay = 0 }: {
  className?: string; title: string; desc: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div {...reveal} transition={{ duration: 0.5, delay }} className={`tile glass p-6 flex flex-col ${className}`}>
      <div className="flex-1 min-h-[150px] flex items-center justify-center mb-5">{children}</div>
      <h3 className="font-serif text-[18px] text-ink mb-1.5">{title}</h3>
      <p className="text-dim text-[13px] leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function Bento() {
  const drivers = [["Rule of 40", 82], ["EV / Revenue", 64], ["Growth", 71], ["Gross margin", 90]] as const;
  const ff = [[8, 62, "cyan"], [20, 78, "violet"], [34, 90, "signal"], [14, 70, "cyan"]] as const;
  return (
    <section className="mb-24">
      <motion.div {...reveal} className="text-center mb-12">
        <h2 className="font-serif text-3xl sm:text-5xl text-ink mb-3">One workspace, from first look to memo</h2>
        <p className="text-dim text-[15px] max-w-xl mx-auto">Everything an M&amp;A screening workflow needs, free while DealFlow is in beta.</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Tile className="md:col-span-2" title="Explainable fit scores" delay={0}
          desc="Every score breaks into the criteria that produced it. No black box.">
          <div className="flex items-center gap-5">
            <ScoreRing score={78} size={110} />
            <div className="space-y-2 w-28">
              {drivers.map(([l, v], i) => (
                <div key={l}>
                  <div className="text-[10px] text-dim mb-0.5">{l}</div>
                  <div className="h-1.5 rounded-full bg-line/60 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, rgb(var(--color-cyan)), rgb(var(--color-signal)))" }}
                      initial={{ width: 0 }} whileInView={{ width: `${v}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tile>

        <Tile className="md:col-span-2" title="DCF and comps workbench" delay={0.08}
          desc="Adjust growth, margin and WACC and watch the football field move.">
          <div className="w-full max-w-[260px] space-y-2.5">
            {ff.map(([l, w, c], i) => (
              <div key={i} className="relative h-4 rounded-full bg-line/40">
                <motion.div className="absolute top-0 h-4 rounded-full"
                  style={{ left: `${l}%`, background: `rgb(var(--color-${c}))`, boxShadow: `0 0 14px rgb(var(--color-${c}) / 0.55)` }}
                  initial={{ width: 0 }} whileInView={{ width: `${w - l}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 + i * 0.12 }} />
              </div>
            ))}
            <div className="relative h-px bg-line mt-3"><span className="absolute left-[52%] -top-3 h-6 w-px bg-signal" /></div>
          </div>
        </Tile>

        <Tile className="md:col-span-2" title="Live deal wire" delay={0.16}
          desc="Deals as they are reported, with parties, size and status pulled out.">
          <svg viewBox="0 0 240 110" className="w-full max-w-[260px]" fill="none">
            <defs>
              <linearGradient id="wire" x1="0" x2="1"><stop stopColor="rgb(var(--color-cyan))" /><stop offset="1" stopColor="rgb(var(--color-signal))" /></linearGradient>
            </defs>
            <path d="M0 70 H40 L52 70 L60 24 L72 98 L84 56 L92 70 H150 L160 40 L170 82 L178 70 H240" stroke="url(#wire)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="dash-flow" style={{ strokeDasharray: "none" }} />
            <path d="M0 70 H240" stroke="rgb(var(--color-line))" strokeDasharray="2 6" />
            <circle cx="170" cy="82" r="5" fill="rgb(var(--color-signal))"><animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" /></circle>
          </svg>
        </Tile>

        <Tile className="md:col-span-3" title="News with a point of view" delay={0.05}
          desc="Headlines from Yahoo Finance, CNBC, MarketWatch and Google News, tagged by company, sector and tone.">
          <div className="w-full max-w-[380px] space-y-2.5">
            {[["bg-up", 88, "Earnings beat"], ["bg-dim/50", 70, "Guidance held"], ["bg-down", 56, "Probe widens"]].map(([c, w, t], i) => (
              <motion.div key={t as string} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 * i }}
                className="flex items-center gap-3 glass !rounded-xl px-3 py-2">
                <span className={`h-2 w-2 rounded-full ${c}`} />
                <div className="flex-1"><div className="h-2 rounded-full bg-line/70" style={{ width: `${w}%` }} /></div>
                <span className="text-[10.5px] text-dim">{t}</span>
              </motion.div>
            ))}
          </div>
        </Tile>

        <Tile className="md:col-span-3" title="Pipeline and AI memos" delay={0.1}
          desc="Track targets from watching to shortlisted, then generate a memo grounded in your numbers.">
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[380px]">
            {["Watching", "Researching", "Shortlisted"].map((col, ci) => (
              <div key={col} className="rounded-xl bg-line/25 p-2 space-y-1.5">
                <div className="text-[9.5px] text-dim">{col}</div>
                {Array.from({ length: 3 - ci }).map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * (i + ci) }}
                    className="h-6 rounded-md glass !rounded-md" style={{ borderColor: ci === 2 ? "rgb(var(--color-signal) / 0.7)" : undefined }} />
                ))}
              </div>
            ))}
          </div>
        </Tile>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- sectors */
function Sectors() {
  return (
    <section className="mb-24">
      <motion.div {...reveal} className="text-center mb-10">
        <h2 className="font-serif text-3xl sm:text-5xl text-ink mb-3">{SECTOR_ORDER.length} sectors, one screener</h2>
        <p className="text-dim text-[15px]">Pick a sector and rank every company in it. All free during the beta.</p>
      </motion.div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SECTOR_ORDER.map((key, i) => {
          const hue = sectorHue(key);
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.35, delay: Math.min((i % 5) * 0.05, 0.25) }}>
              <Link href={`/screener?sector=${key}`} className="tile glass block p-4 h-full">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3"
                  style={{ background: `hsl(${hue} 85% 60% / 0.16)`, color: `hsl(${hue} 90% 68%)`, boxShadow: `inset 0 0 0 1px hsl(${hue} 85% 60% / 0.35)` }}>
                  <SectorIcon sector={key} size={17} />
                </span>
                <div className="text-ink text-[14px] font-semibold leading-tight mb-1">{SECTOR_LABELS[key]}</div>
                <div className="text-dim text-[11.5px] leading-snug">{SECTOR_BLURBS[key]}</div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- live wire */
function LiveWire() {
  const { data } = useQuery({ queryKey: ["landing-deals"], queryFn: () => api.liveDeals(undefined, 7), staleTime: 60_000, refetchInterval: 90_000, retry: 1 });
  const items = (data?.items ?? []).filter((i) => i.deal).slice(0, 5);
  if (items.length === 0) return null;
  return (
    <motion.section {...reveal} className="mb-24 max-w-3xl mx-auto">
      <div className="flex items-end justify-between mb-5">
        <h2 className="font-serif text-2xl sm:text-3xl text-ink flex items-center gap-3"><span className="live-dot" /> On the wire right now</h2>
        <Link href="/deals" className="text-signal text-[13px] hover:underline inline-flex items-center gap-1">All deals <ArrowRight size={13} /></Link>
      </div>
      <DealVolume />
      <div className="space-y-2.5">
        {items.map((it) => (
          <a key={it.link} href={it.link} target="_blank" rel="noopener noreferrer" className="glow-card glass flex items-start gap-3 p-4">
            <span className="text-[10.5px] border border-signal text-signal px-2 py-0.5 capitalize shrink-0 mt-0.5 !rounded-full">{it.deal?.status}</span>
            <span className="text-ink text-[13.5px] leading-snug flex-1">{it.title}</span>
            <span className="text-dim text-[11px] shrink-0 text-right">
              {fmtDealValue(it.deal?.value_musd) && <span className="block text-ink tabular-nums">{fmtDealValue(it.deal?.value_musd)}</span>}
              {timeAgo(it.published)}
            </span>
          </a>
        ))}
      </div>
    </motion.section>
  );
}

/* ----------------------------------------------------------- how it works */
function HowItWorks() {
  const steps = [
    ["1", "Screen", "Pick a sector and rank every company by growth, margins and valuation."],
    ["2", "Value", "Run a DCF, comps and an LBO check, then see who could realistically afford it."],
    ["3", "Track", "Follow live deals and news, set alerts, and keep a pipeline of targets."],
    ["4", "Share", "Generate an investment memo and send it as a link or PDF."],
  ];
  return (
    <section className="mb-24" aria-labelledby="how-h">
      <motion.h2 {...reveal} id="how-h" className="font-serif text-3xl sm:text-5xl text-ink text-center mb-10">How it works</motion.h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([n, t, d]) => (
          <motion.div key={n} {...reveal} className="glass p-5">
            <div className="font-serif text-4xl text-signal mb-2">{n}</div>
            <div className="text-ink text-[15px] mb-1">{t}</div>
            <p className="text-dim text-[12.5px] leading-relaxed">{d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- pricing */
function Pricing() {
  return (
    <section id="pricing" className="mb-24">
      <motion.div {...reveal} className="text-center mb-10">
        <h2 className="font-serif text-3xl sm:text-5xl text-ink mb-3">Free during the beta</h2>
        <p className="text-dim text-[15px]">Paid tiers may come later. Everything below is free to use right now.</p>
      </motion.div>
      <motion.div {...reveal} className="relative max-w-md mx-auto">
        <div className="absolute -inset-px rounded-[20px] ring-gradient opacity-70 blur-[1px]" />
        <div className="relative glass !rounded-[20px] p-8">
          <div className="text-dim text-[12px] mb-1">Everything included</div>
          <div className="font-serif text-6xl text-ink mb-6">$0</div>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-dim">
                <Check size={15} className="text-up mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Link href="/screener" className="bg-signal block text-center px-5 py-3.5 text-[14px]">Start now</Link>
        </div>
      </motion.div>
    </section>
  );
}

function FinalCta() {
  return (
    <motion.section {...reveal} className="text-center pb-6">
      <p className="text-dim text-[12px] mb-4 inline-flex items-center gap-2"><Newspaper size={13} /> Figures are modeled estimates from public market data. Not investment advice.</p>
    </motion.section>
  );
}
