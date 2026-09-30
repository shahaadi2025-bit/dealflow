"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [showRecents, setShowRecents] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setRecents(getRecents()), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowRecents(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const navigate = (t: string) => {
    pushRecent(t);
    setShowRecents(false);
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

  const dropdown = showRecents && recents.length > 0 && (
    <div className="absolute z-20 top-full left-0 mt-1 w-full bg-surface border border-line">
      <div className="text-dim text-[10px] px-3 py-1.5 uppercase tracking-wide border-b border-line">Recent</div>
      {recents.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => navigate(t)}
          className="block w-full text-left px-3 py-1.5 text-[12px] text-ink hover:bg-bg transition-colors"
        >
          {t}
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
            onFocus={() => setShowRecents(true)}
            placeholder="Look up any ticker - AAPL, MSFT..."
            className="flex-1 bg-surface border border-line px-3 py-2.5 text-ink placeholder:text-dim/60 focus-ring"
          />
          <button type="submit" className="bg-signal text-bg px-4 py-2.5 text-[12px] font-medium hover:opacity-90 transition-opacity focus-ring">
            Analyze
          </button>
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
          onFocus={() => setShowRecents(true)}
          placeholder="Jump to ticker..."
          className="w-40 bg-surface border border-line px-3 py-1.5 text-[12px] text-ink placeholder:text-dim/60 focus-ring"
        />
      </form>
      {dropdown}
      {error && <p className="absolute top-full mt-1 text-down text-[10px] whitespace-nowrap">{error}</p>}
    </div>
  );
}