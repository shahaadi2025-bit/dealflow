"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, LineChart, FileText, Layers, Sparkles, Target, Check } from "lucide-react";
import { Logo } from "@/components/Logo";

const FEATURES = [
  { icon: Target, title: "Explainable screening", desc: "Every fit score breaks down into the exact criteria that produced it - growth, margin, leverage, deal size fit. No black box." },
  { icon: LineChart, title: "Full DCF workbench", desc: "Adjustable growth, margin, and WACC assumptions with a live sensitivity grid and football-field valuation range." },
  { icon: Layers, title: "Comparable companies", desc: "Peer multiples pulled from the same sector, with transparent exclusion reasons for anything left out." },
  { icon: Sparkles, title: "AI investment memos", desc: "A six-section memo grounded in the numbers you just computed - the model writes prose, it doesn't invent figures." },
  { icon: FileText, title: "Export everything", desc: "CSV workbooks, styled PDF reports, and markdown-ready memos you can paste straight into your own docs." },
  { icon: TrendingUp, title: "Deal pipeline", desc: "Track targets from Watching through Shortlisted with a Kanban board, saved locally in your browser." },
];

const FREE_FEATURES = ["All 8 sectors - SaaS, Fintech, EV, Healthcare, Cybersecurity, Cloud Infra, Consumer, Media", "Full DCF and comps valuation", "AI-generated investment memos", "CSV and PDF export", "Deal pipeline tracker", "Unlimited ticker search"];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(var(--color-signal)) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <Logo size={44} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl text-ink leading-tight mb-5"
          >
            Screen, value, and memo an acquisition target in minutes.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-dim text-[15px] leading-relaxed mb-8 max-w-xl mx-auto"
          >
            DealFlow is a research-grade M&amp;A screener: explainable fit scores, a full
            DCF and comps workbench, and AI investment memos grounded in numbers you can trace.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Link href="/screener" className="bg-signal text-bg px-6 py-3 text-[13px] font-medium hover:opacity-90 transition-opacity">
              Launch the screener
            </Link>
            <a href="#pricing" className="border border-line text-ink px-6 py-3 text-[13px] hover:border-signal transition-colors">
              See pricing
            </a>
          </motion.div>
        </div>

        {/* Animated bar-chart motif */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative mt-16 max-w-2xl mx-auto flex items-end justify-center gap-3 h-28"
        >
          {[40, 65, 50, 80, 60, 95, 70, 55, 85, 45].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.05, ease: "easeOut" }}
              className="w-6 sm:w-8 rounded-t-sm"
              style={{ background: i === 5 ? "rgb(var(--color-signal))" : "rgb(var(--color-line))" }}
            />
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-line">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-2xl text-ink text-center mb-12"
        >
          Everything a screening workflow needs
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto px-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              whileHover={{ borderColor: "rgb(var(--color-signal))" }}
              className="border border-line p-5 transition-colors"
            >
              <f.icon size={18} className="text-signal mb-3" />
              <div className="text-ink text-[13px] mb-1.5">{f.title}</div>
              <div className="text-dim text-[12px] leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sectors */}
      <section className="py-16 border-t border-line">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-2xl text-ink text-center mb-3"
        >
          Fourteen sectors, one screener
        </motion.h2>
        <p className="text-dim text-[13px] text-center mb-10">All free during the current beta.</p>
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto px-4">
          {[
            { label: "SaaS", pro: false }, { label: "Fintech", pro: false }, { label: "Electric Vehicles", pro: false },
            { label: "Healthcare", pro: false }, { label: "Cybersecurity", pro: false }, { label: "Cloud Infra", pro: false },
            { label: "Consumer", pro: false }, { label: "Media", pro: false }, { label: "Semiconductors", pro: false },
            { label: "Real Estate", pro: false }, { label: "Industrials", pro: false }, { label: "Energy", pro: false },
            { label: "Aerospace & Defense", pro: false }, { label: "Telecom", pro: false },
          ].map((s, i) => (
            <motion.span
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="border border-line px-3 py-1.5 text-[12px] text-dim flex items-center gap-1.5"
            >
              {s.label}
            </motion.span>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 border-t border-line">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-2xl text-ink text-center mb-3"
        >
          Free during the beta
        </motion.h2>
        <p className="text-dim text-[13px] text-center mb-12">Paid tiers may come later - everything below is free to use right now.</p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="border border-line p-6 max-w-sm mx-auto"
        >
          <div className="text-dim text-[11px] mb-1">Everything</div>
          <div className="font-serif text-3xl text-ink mb-5">$0</div>
          <ul className="space-y-2.5 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12px] text-dim">
                <Check size={13} className="text-up mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/screener" className="block text-center border border-line px-4 py-2.5 text-[12px] text-ink hover:border-signal transition-colors">
            Start now
          </Link>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t border-line text-center">
        <p className="text-dim text-[12px] mb-4">Figures are modeled estimates from public market data. Not investment advice.</p>
        <Link href="/screener" className="text-signal text-[13px] hover:underline">
          Go to the screener -&gt;
        </Link>
      </section>
    </div>
  );
}