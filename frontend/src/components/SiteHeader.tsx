"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { TickerSearch } from "./TickerSearch";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { MarketTape } from "./MarketTape";
import { getPipeline } from "@/lib/pipeline";

const LINKS = [
  { href: "/screener", label: "Screener", icon: true },
  { href: "/deals", label: "Deals", live: true },
  { href: "/news", label: "News" },
  { href: "/sectors", label: "Sectors" },
  { href: "/pipeline", label: "Pipeline", badge: true },
  { href: "/methodology", label: "Methodology" },
];

export function SiteHeader() {
  const [pipelineCount, setPipelineCount] = useState(0);
  const pathname = usePathname() || "/";

  useEffect(() => {
    const update = () => setPipelineCount(getPipeline().length);
    update();
    window.addEventListener("dealflow:pipeline-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("dealflow:pipeline-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 px-3 sm:px-5 pt-3">
      <div className="glass mx-auto max-w-[1400px] !rounded-2xl overflow-hidden">
        <div className="px-3 sm:px-5 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-5 gap-y-2">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="DealFlow home">
            <div className="transition-transform group-hover:scale-110 group-hover:rotate-3"><Logo size={26} /></div>
            <span className="font-serif text-[19px] font-bold tracking-tight text-ink">DealFlow</span>
          </Link>

          <nav className="flex items-center gap-1 text-[13px] order-last w-full overflow-x-auto no-scrollbar whitespace-nowrap sm:order-none sm:w-auto sm:overflow-visible">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link key={l.href} href={l.href}
                  className={`relative px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${active ? "text-ink" : "text-dim hover:text-ink"}`}>
                  {active && <span className="absolute inset-0 rounded-full bg-signal/15 ring-1 ring-signal/40 -z-10" />}
                  {l.icon && <LayoutGrid size={13} />}
                  {l.live && <span className="live-dot" />}
                  {l.label}
                  {l.badge && pipelineCount > 0 && (
                    <span className="text-signal text-[10px] bg-signal/15 px-1.5 rounded-full tabular-nums">{pipelineCount}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="hidden lg:flex items-center gap-1.5 text-dim text-[11px] border border-line px-2.5 py-1.5 hover:border-signal hover:text-ink transition-colors"
            >
              Jump to
              <kbd className="text-[10px] border border-line px-1 rounded">Ctrl K</kbd>
            </button>
            <TickerSearch variant="header" />
            <ThemeToggle />
          </div>
        </div>
        <MarketTape />
      </div>
    </header>
  );
}
