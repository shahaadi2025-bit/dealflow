"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { api } from "@/lib/api";

type Item = { label: string; sub?: string; action: () => void };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tickerMatches, setTickerMatches] = useState<{ ticker: string; name: string }[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(""); setTickerMatches([]); }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) { setTickerMatches([]); return; }
    debounceRef.current = setTimeout(() => {
      api.searchTickers(query.trim()).then((r) => setTickerMatches(r.results)).catch(() => setTickerMatches([]));
    }, 150);
  }, [query]);

  const go = (path: string) => { router.push(path); setOpen(false); };

  const navItems: Item[] = [
    { label: "Screener", sub: "Browse and filter companies", action: () => go("/screener") },
    { label: "Live deal wire", sub: "M&A as it is reported", action: () => go("/deals") },
    { label: "Market news", sub: "Headlines by company and sector", action: () => go("/news") },
    { label: "Pipeline", sub: "Your tracked targets", action: () => go("/pipeline") },
    { label: "Deal alerts", sub: "Get notified of matching deals", action: () => go("/alerts") },
    { label: "Sector comparison", sub: "Median stats by sector", action: () => go("/sectors") },
    { label: "Methodology", sub: "How the numbers are calculated", action: () => go("/methodology") },
  ];
  const filteredNav = query
    ? navItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : navItems;

  const tickerItems: Item[] = tickerMatches.map((t) => ({
    label: t.ticker,
    sub: t.name || "Jump to valuation",
    action: () => go(`/company/${t.ticker}`),
  }));

  const allItems = [...tickerItems, ...filteredNav];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-surface border border-line shadow-2xl"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
              <Search size={15} className="text-dim" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a ticker or page..."
                className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-dim/60 outline-none"
              />
              <kbd className="text-dim text-[10px] border border-line px-1.5 py-0.5 rounded">esc</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {allItems.length === 0 && (
                <p className="text-dim text-[12px] px-4 py-3">No matches.</p>
              )}
              {allItems.map((item, i) => (
                <button
                  key={item.label + i}
                  onClick={item.action}
                  className="w-full text-left px-4 py-2 hover:bg-bg transition-colors flex items-center justify-between group"
                >
                  <span className="text-ink text-[13px] group-hover:text-signal transition-colors">{item.label}</span>
                  {item.sub && <span className="text-dim text-[11px]">{item.sub}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}