"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { TickerSearch } from "./TickerSearch";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { getPipeline } from "@/lib/pipeline";

export function SiteHeader() {
  const [pipelineCount, setPipelineCount] = useState(0);

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
    <header className="border-b border-line sticky top-0 bg-bg/95 backdrop-blur z-10">
      <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="transition-transform group-hover:scale-110">
            <Logo size={20} />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight text-ink">DealFlow</span>
          <span className="text-dim text-[11px] tracking-wide hidden sm:inline">deal screener</span>
        </Link>
        <nav className="flex items-center gap-6 text-[12px] text-dim shrink-0">
          <Link href="/" className="hover:text-ink transition-colors flex items-center gap-1.5">
            <LayoutGrid size={13} />
            Screener
          </Link>
          <Link href="/sectors" className="hover:text-ink transition-colors">Sectors</Link>
          <Link href="/pipeline" className="hover:text-ink transition-colors flex items-center gap-1">
            Pipeline
            {pipelineCount > 0 && (
              <span className="text-signal text-[10px] border border-signal/40 px-1 rounded">{pipelineCount}</span>
            )}
          </Link>
          <Link href="/deals" className="hover:text-ink transition-colors hidden sm:inline">Deals</Link>
          <Link href="/methodology" className="hover:text-ink transition-colors hidden md:inline">Methodology</Link>
          <span className="text-line hidden md:inline">/</span>
          <span className="hidden md:inline">DCF - Comps - Memo</span>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="hidden lg:flex items-center gap-1.5 text-dim text-[11px] border border-line px-2 py-1 hover:border-signal hover:text-ink transition-colors"
          >
            Jump to...
            <kbd className="text-[10px] border border-line px-1 rounded">Ctrl K</kbd>
          </button>
          <TickerSearch variant="header" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}