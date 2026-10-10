"use client";
import { useEffect } from "react";

/** Fixed aurora + grid layers behind every page, and a pointer spotlight for .glow-card / .tile. */
export function Backdrop() {
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = (e.target as HTMLElement | null)?.closest?.(".glow-card, .tile") as HTMLElement | null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => { document.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="backdrop" aria-hidden="true">
      <span className="blob b1" />
      <span className="blob b2" />
      <span className="blob b3" />
      <span className="grid-lines" />
      <svg className="pricewave" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--color-signal))" stopOpacity="0.16" /><stop offset="100%" stopColor="rgb(var(--color-signal))" stopOpacity="0" /></linearGradient>
        </defs>
        <path d="M0 53.6 L30 56.3 L60 60.8 L90 58.4 L120 61.3 L150 56.2 L180 53.0 L210 52.1 L240 51.2 L270 54.2 L300 60.6 L330 62.5 L360 58.3 L390 54.3 L420 51.6 L450 54.2 L480 52.7 L510 46.8 L540 53.2 L570 51.5 L600 46.3 L630 45.9 L660 52.7 L690 55.4 L720 52.2 L750 54.6 L780 54.6 L810 51.9 L840 46.6 L870 47.3 L900 48.5 L930 53.5 L960 51.4 L990 48.3 L1020 51.4 L1050 53.9 L1080 49.7 L1110 54.2 L1140 61.2 L1170 66.3 L1200 63.2 L1200 120 L0 120 Z" fill="url(#pw)" />
        <path className="pw-line" d="M0 53.6 L30 56.3 L60 60.8 L90 58.4 L120 61.3 L150 56.2 L180 53.0 L210 52.1 L240 51.2 L270 54.2 L300 60.6 L330 62.5 L360 58.3 L390 54.3 L420 51.6 L450 54.2 L480 52.7 L510 46.8 L540 53.2 L570 51.5 L600 46.3 L630 45.9 L660 52.7 L690 55.4 L720 52.2 L750 54.6 L780 54.6 L810 51.9 L840 46.6 L870 47.3 L900 48.5 L930 53.5 L960 51.4 L990 48.3 L1020 51.4 L1050 53.9 L1080 49.7 L1110 54.2 L1140 61.2 L1170 66.3 L1200 63.2" fill="none" stroke="rgb(var(--color-signal))" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="grain" />
    </div>
  );
}
