"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TickerSearch({ variant = "header" }: { variant?: "header" | "hero" }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const t = value.trim().toUpperCase();
    if (!t) return;
    if (!/^[A-Z.\-]{1,10}$/.test(t)) {
      setError("Enter a valid ticker, e.g. AAPL");
      return;
    }
    setError("");
    router.push(`/company/${t}`);
  };

  if (variant === "hero") {
    return (
      <form onSubmit={go} className="flex gap-2 max-w-sm">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Look up any ticker — AAPL, MSFT…"
          className="flex-1 bg-surface border border-line px-3 py-2.5 text-ink placeholder:text-dim/60 focus-ring"
        />
        <button type="submit" className="bg-signal text-bg px-4 py-2.5 text-[12px] font-medium hover:opacity-90 transition-opacity focus-ring">
          Analyze
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={go} className="relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Jump to ticker…"
        className="w-40 bg-surface border border-line px-3 py-1.5 text-[12px] text-ink placeholder:text-dim/60 focus-ring"
      />
      {error && <p className="absolute top-full mt-1 text-down text-[10px] whitespace-nowrap">{error}</p>}
    </form>
  );
}