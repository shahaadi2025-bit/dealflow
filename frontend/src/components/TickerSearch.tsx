"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

const RECENTS_KEY = "dealflow:recent-tickers";

function getRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function pushRecent(ticker: string) {
  const cur = getRecents().filter((t) => t !== ticker);
  cur.unshift(ticker);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(cur.slice(0, 5)));
}

export function TickerSearch({ variant = "header" }: { variant?: "header" | "hero" }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ ticker: string; name: string }[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setRecents(getRecents()), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      api.searchTickers(value.trim()).then((r) => setSuggestions(r.results)).catch(() => setSuggestions([]));
    }, 150);
  }, [value]);

  const navigate = (t: string) => {
    pushRecent(t);
    setOpen(false);
    setValue("");
    router.push(`/company/${t}`);
  };

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const t = value.trim().toUpperCase();
    if (!t) return;
    if (!/^[A-Z.\-]{1,10}$/.test(t)) {
      setError("Enter a valid ticker, e.g. AAPL");
      return;
    }
    setError("");
    navigate(t);
  };

  const showSuggestions = suggestions.length > 0;
  const showRecents = !showSuggestions && recents.length > 0;

  const dropdown = open && (showSuggestions || showRecents) && (
    <div className="absolute z-20 top-full left-0 mt-1 w-full min-w-[220px] bg-surface border border-line">
      <div className="text-dim text-[10px] px-3 py-1.5 uppercase tracking-wide border-b border-line">
        {showSuggestions ? "Matches" : "Recent"}
      </div>
      {(showSuggestions ? suggestions : recents.map((t) => ({ ticker: t, name: "" }))).map((s) => (
        <button
          key={s.ticker}
          type="button"
          onClick={() => navigate(s.ticker)}
          className="flex justify-between w-full text-left px-3 py-1.5 text-[12px] text-ink hover:bg-bg transition-colors"
        >
          <span>{s.ticker}</span>
          {s.name && <span className="text-dim text-[11px]">{s.name}</span>}
        </button>
      ))}
    </div>
  );

  if (variant === "hero") {
    return (
      <div ref={wrapRef} className="relative">
        <form onSubmit={go} className="flex gap-2 max-w-sm">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Look up any ticker - AAPL, MSFT..."
            className="flex-1 bg-surface border border-line px-3 py-2.5 text-ink placeholder:text-dim/60 focus-ring"
          />
          <motion.button whileTap={{ scale: 0.96 }} type="submit" className="bg-signal text-bg px-4 py-2.5 text-[12px] font-medium hover:opacity-90 transition-opacity focus-ring">
            Analyze
          </motion.button>
        </form>
        {dropdown}
        {error && <p className="text-down text-[11px] mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <form onSubmit={go}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Jump to ticker..."
          className="w-40 bg-surface border border-line px-3 py-1.5 text-[12px] text-ink placeholder:text-dim/60 focus-ring"
        />
      </form>
      {dropdown}
      {error && <p className="absolute top-full mt-1 text-down text-[10px] whitespace-nowrap">{error}</p>}
    </div>
  );
}