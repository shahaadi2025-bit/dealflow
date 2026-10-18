"use client";
import { useEffect, useRef, useState } from "react";

/** Renders children only once the placeholder nears the viewport, so below-the-fold panels do not fire their API calls up front. */
export function LazyMount({ children, minHeight = 160 }: { children: React.ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setShow(true); io.disconnect(); } }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  return <div ref={ref} style={show ? undefined : { minHeight }}>{show ? children : null}</div>;
}
