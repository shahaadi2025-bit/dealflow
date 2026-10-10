"use client";
import { useEffect, useState } from "react";
import { fmtPrice } from "@/lib/format";

/** Semi-circle gauge: DCF value vs market price. Needle sweeps from deep overvalued to deep undervalued. */
export function VerdictGauge({ price, fair }: { price: number; fair: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const id = setTimeout(() => setReady(true), 250); return () => clearTimeout(id); }, []);
  if (!price || !fair || fair <= 0) return null;
  const upside = fair / price - 1;
  const t = Math.max(0, Math.min(1, (upside + 0.5) / 1.0)); // -50%..+50%
  const angle = -90 + t * 180;
  const label = upside > 0.15 ? "Undervalued" : upside < -0.15 ? "Overvalued" : "Fairly valued";
  const tone = upside > 0.15 ? "text-up" : upside < -0.15 ? "text-down" : "text-signal";
  return (
    <div className="glass p-5 flex items-center gap-5" aria-label={`DCF verdict: ${label}`}>
      <svg viewBox="0 0 120 70" className="w-[150px] shrink-0">
        <defs><linearGradient id="vg" x1="0" x2="1"><stop offset="0" stopColor="rgb(var(--color-down))" /><stop offset="0.5" stopColor="rgb(var(--color-signal))" /><stop offset="1" stopColor="rgb(var(--color-up))" /></linearGradient></defs>
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="rgb(var(--color-line))" strokeOpacity="0.6" strokeWidth="10" strokeLinecap="round" />
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="url(#vg)" strokeWidth="10" strokeLinecap="round" />
        <line x1="60" y1="60" x2="60" y2="20" stroke="rgb(var(--color-ink))" strokeWidth="2.5" strokeLinecap="round"
          style={{ transformOrigin: "60px 60px", transformBox: "view-box", transform: `rotate(${ready ? angle : -90}deg)`, transition: "transform 1.1s cubic-bezier(.2,1.2,.3,1)" }} />
        <circle cx="60" cy="60" r="5" fill="rgb(var(--color-ink))" />
      </svg>
      <div>
        <div className="text-dim text-[11px]">DCF verdict</div>
        <div className={`font-serif text-2xl ${tone}`}>{label}</div>
        <div className="text-dim text-[12px] tabular-nums mt-0.5">
          {upside >= 0 ? "▲" : "▼"} {Math.abs(upside * 100).toFixed(0)}% vs {fmtPrice(price)} market price
        </div>
        <div className="text-dim text-[10.5px] mt-1">Model value {fmtPrice(fair)}. Moves with the sliders below.</div>
      </div>
    </div>
  );
}
