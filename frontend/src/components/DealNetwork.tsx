"use client";
import { useEffect, useRef } from "react";

type Node = { x: number; y: number; bx: number; by: number; label: string; hue: number; phase: number; ripple: number };
type Edge = { a: number; b: number; bend: number; speed: number; t: number };

const LABELS = ["CRM", "NVDA", "XOM", "PFE", "MSFT", "KKR", "BX", "TSLA", "V", "CSCO", "LMT", "AMZN", "DIS", "ABBV", "SHOP", "NEE", "JPM", "ADBE"];
const EVENTS = ["$4.2B announced", "$890M tender offer", "$12B in talks", "$2.3B completed", "$6.1B take-private", "$1.4B all-stock"];

function rgb(v: string): string {
  return `rgb(${v.trim().split(/\s+/).join(",")})`;
}

/** Hero graphic: companies as nodes, deals as currents flowing between them. Canvas, no dependencies. */
export function DealNetwork({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1, raf = 0, running = true, visible = true;
    let mx = 0, my = 0, tx = 0, ty = 0;
    let colors = { surface: "#111a46", cyan: "#38bdf8", violet: "#8b7cff", signal: "#ff8a3d", ink: "#eef2ff", line: "#2d3c80", up: "#34d399" };
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = {
        surface: rgb(cs.getPropertyValue("--color-surface")), cyan: rgb(cs.getPropertyValue("--color-cyan")), violet: rgb(cs.getPropertyValue("--color-violet")),
        signal: rgb(cs.getPropertyValue("--color-signal")), ink: rgb(cs.getPropertyValue("--color-ink")),
        line: rgb(cs.getPropertyValue("--color-line")), up: rgb(cs.getPropertyValue("--color-up")),
      };
    };

    // deterministic layout so the hero looks the same on every load
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const burst: { e: number; t: number; text: string }[] = [];

    const build = () => {
      nodes.length = 0; edges.length = 0; seed = 7;
      const cols = w < 640 ? 4 : 6, rows = 3;
      LABELS.slice(0, cols * rows).forEach((label, i) => {
        const cx = i % cols, cy = Math.floor(i / cols);
        const bx = ((cx + 0.5 + (rnd() - 0.5) * 0.7) / cols) * w;
        const by = ((cy + 0.5 + (rnd() - 0.5) * 0.7) / rows) * h;
        nodes.push({ x: bx, y: by, bx, by, label, hue: i % 3, phase: rnd() * 6.28, ripple: 0 });
      });
      for (let i = 0; i < nodes.length; i++) {
        const near = nodes.map((n, j) => ({ j, d: Math.hypot(n.bx - nodes[i].bx, n.by - nodes[i].by) }))
          .filter((o) => o.j !== i).sort((a, b) => a.d - b.d).slice(0, 2);
        for (const o of near) {
          if (!edges.some((e) => (e.a === i && e.b === o.j) || (e.a === o.j && e.b === i)))
            edges.push({ a: i, b: o.j, bend: (rnd() - 0.5) * 0.5, speed: 0.12 + rnd() * 0.2, t: rnd() });
        }
      }
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const pt = (e: Edge, t: number) => {
      const a = nodes[e.a], b = nodes[e.b];
      const mxp = (a.x + b.x) / 2 - (b.y - a.y) * e.bend, myp = (a.y + b.y) / 2 + (b.x - a.x) * e.bend;
      const u = 1 - t;
      return { x: u * u * a.x + 2 * u * t * mxp + t * t * b.x, y: u * u * a.y + 2 * u * t * myp + t * t * b.y, cx: mxp, cy: myp };
    };

    let last = performance.now(), nextBurst = last + 1200, frame = 0;
    const draw = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (frame++ % 90 === 0) readColors();
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x = n.bx + Math.sin(now / 2200 + n.phase) * 6 + mx * (8 + n.hue * 4);
        n.y = n.by + Math.cos(now / 2600 + n.phase) * 6 + my * (8 + n.hue * 4);
        n.ripple = Math.max(0, n.ripple - dt * 0.9);
      }
      // edges
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b], m = pt(e, 0.5);
        const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, colors.cyan); g.addColorStop(1, colors.violet);
        ctx.globalAlpha = 0.22; ctx.strokeStyle = g; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(m.cx, m.cy, b.x, b.y); ctx.stroke();
        // particles (two per edge)
        for (let k = 0; k < 2; k++) {
          const t = (e.t + k * 0.5) % 1;
          const p = pt(e, t);
          ctx.globalAlpha = 0.9 * Math.sin(Math.PI * t);
          ctx.fillStyle = k ? colors.signal : colors.cyan;
          ctx.shadowColor = k ? colors.signal : colors.cyan; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
        }
        if (!reduce) e.t = (e.t + e.speed * dt) % 1;
      }
      // deal bursts
      if (!reduce && now > nextBurst && edges.length) {
        const ei = Math.floor(Math.random() * edges.length);
        burst.push({ e: ei, t: 0, text: EVENTS[Math.floor(Math.random() * EVENTS.length)] });
        nodes[edges[ei].a].ripple = 1; nodes[edges[ei].b].ripple = 1;
        nextBurst = now + 2200 + Math.random() * 1800;
      }
      for (let i = burst.length - 1; i >= 0; i--) {
        const bu = burst[i]; bu.t += dt / 3.4;
        if (bu.t >= 1) { burst.splice(i, 1); continue; }
        const m = pt(edges[bu.e], 0.5);
        const a = Math.sin(Math.PI * bu.t);
        ctx.globalAlpha = a; ctx.font = "600 11px var(--font-mono), monospace";
        const tw = ctx.measureText(bu.text).width + 18, bx = m.x - tw / 2, by = m.y - 30 - bu.t * 10;
        ctx.fillStyle = colors.surface; ctx.strokeStyle = colors.signal; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx, by, tw, 22, 11); ctx.fill(); ctx.stroke();
        ctx.fillStyle = colors.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(bu.text, m.x, by + 11.5);
      }
      // nodes
      for (const n of nodes) {
        const col = [colors.cyan, colors.violet, colors.signal][n.hue];
        if (n.ripple > 0) {
          ctx.globalAlpha = n.ripple * 0.6; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(n.x, n.y, 12 + (1 - n.ripple) * 30, 0, 6.28); ctx.stroke();
        }
        ctx.globalAlpha = 0.18; ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(n.x, n.y, 15, 0, 6.28); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(n.x, n.y, 4.5, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.85; ctx.fillStyle = colors.ink; ctx.font = "600 10.5px var(--font-mono), monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillText(n.label, n.x, n.y + 27);
      }
      ctx.globalAlpha = 1;
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.01 });
    io.observe(canvas);
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    readColors(); resize();
    raf = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); window.removeEventListener("pointermove", onMove); };
  }, []);

  return <canvas ref={ref} className={`w-full h-full block ${className}`} aria-hidden="true" />;
}
