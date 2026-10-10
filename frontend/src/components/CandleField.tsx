"use client";
import { useEffect, useRef } from "react";

const ch = (v: string) => v.trim().split(/\s+/).join(",");

/** Hero graphic: a continuously ticking candlestick chart with moving average, volume and a last-price flag. Illustrative data. */
export function CandleField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    let col = { up: "52,211,153", down: "255,107,107", sig: "230,190,80", line: "66,57,36", ink: "250,246,234", dim: "172,162,136" };
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      col = { up: ch(cs.getPropertyValue("--color-up")), down: ch(cs.getPropertyValue("--color-down")), sig: ch(cs.getPropertyValue("--color-signal")),
        line: ch(cs.getPropertyValue("--color-line")), ink: ch(cs.getPropertyValue("--color-ink")), dim: ch(cs.getPropertyValue("--color-dim")) };
    };
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    type C = { o: number; h: number; l: number; c: number; v: number };
    const candles: C[] = [];
    let price = 100, drift = 0.15;
    const next = (): C => {
      if (rnd() < 0.08) drift = (rnd() - 0.34) * 0.8;
      if (price < 85) drift = Math.abs(drift);
      const o = price;
      const c = o + drift + (rnd() - 0.5) * 3.2;
      const hi = Math.max(o, c) + rnd() * 1.6, lo = Math.min(o, c) - rnd() * 1.6;
      price = c;
      return { o, h: hi, l: lo, c, v: 0.3 + rnd() * 0.7 };
    };
    const N = 64;
    for (let i = 0; i < N + 2; i++) candles.push(next());
    let shift = 0; // 0..1 slide progress toward the next candle
    let last = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      read();
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cw = w / N, top = h * 0.12, bottom = h * 0.80;
      const view = candles.slice(0, N + 2);
      const hi = Math.max(...view.map((c) => c.h)), lo = Math.min(...view.map((c) => c.l));
      const y = (p: number) => bottom - ((p - lo) / (hi - lo || 1)) * (bottom - top);
      // grid
      ctx.strokeStyle = `rgba(${col.line},0.35)`; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) { const gy = top + ((bottom - top) * i) / 5; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      const off = -shift * cw;
      // volume
      view.forEach((c, i) => {
        const x = i * cw + off;
        ctx.fillStyle = `rgba(${c.c >= c.o ? col.up : col.down},0.14)`;
        const vh = c.v * h * 0.16;
        ctx.fillRect(x + cw * 0.18, h - vh, cw * 0.64, vh);
      });
      // candles
      view.forEach((c, i) => {
        const x = i * cw + off, up = c.c >= c.o, rgb = up ? col.up : col.down;
        ctx.strokeStyle = `rgba(${rgb},0.85)`; ctx.fillStyle = `rgba(${rgb},${up ? 0.55 : 0.85})`;
        ctx.beginPath(); ctx.moveTo(x + cw / 2, y(c.h)); ctx.lineTo(x + cw / 2, y(c.l)); ctx.stroke();
        const bt = y(Math.max(c.o, c.c)), bh = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
        ctx.fillRect(x + cw * 0.2, bt, cw * 0.6, bh);
      });
      // 10-period moving average
      ctx.beginPath(); ctx.strokeStyle = `rgba(${col.sig},0.95)`; ctx.lineWidth = 2; ctx.lineJoin = "round";
      view.forEach((_, i) => {
        if (i < 9) return;
        const m = view.slice(i - 9, i + 1).reduce((s, c) => s + c.c, 0) / 10;
        const x = i * cw + off + cw / 2;
        if (i === 9) ctx.moveTo(x, y(m)); else ctx.lineTo(x, y(m));
      });
      ctx.stroke();
      // last price flag
      const lc = view[N - 1];
      const ly = y(lc.c);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = `rgba(${col.ink},0.35)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(w, ly); ctx.stroke(); ctx.setLineDash([]);
      const up = lc.c >= lc.o;
      ctx.fillStyle = `rgba(${up ? col.up : col.down},1)`;
      const label = lc.c.toFixed(2);
      ctx.font = "600 11px ui-monospace, monospace";
      const tw = ctx.measureText(label).width + 14;
      ctx.beginPath();
      (ctx as CanvasRenderingContext2D & { roundRect?: (...a: number[]) => void }).roundRect?.(w - tw - 6, ly - 10, tw, 20, 6);
      if (!(ctx as CanvasRenderingContext2D & { roundRect?: unknown }).roundRect) ctx.rect(w - tw - 6, ly - 10, tw, 20);
      ctx.fill();
      ctx.fillStyle = "#08102e"; ctx.fillText(label, w - tw + 1, ly + 4);
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) { last = now; return; }
      shift += (now - last) / 700; last = now;
      while (shift >= 1) { shift -= 1; candles.shift(); candles.push(next()); }
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (reduce) draw(); else raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); io.disconnect(); mo.disconnect(); };
  }, []);
  return <canvas ref={ref} className={`w-full h-full ${className}`} aria-hidden="true" />;
}
