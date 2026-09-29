import Link from "next/link";
import { TickerSearch } from "./TickerSearch";

export function SiteHeader() {
  return (
    <header className="border-b border-line sticky top-0 bg-bg/95 backdrop-blur z-10">
      <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-serif text-xl font-semibold tracking-tight text-ink">DealFlow</span>
          <span className="text-dim text-[11px] tracking-wide hidden sm:inline">deal screener</span>
        </Link>
        <nav className="flex items-center gap-6 text-[12px] text-dim shrink-0">
          <Link href="/" className="hover:text-ink transition-colors">Screener</Link>
          <span className="text-line hidden md:inline">/</span>
          <span className="hidden md:inline">DCF · Comps · Memo</span>
        </nav>
        <div className="ml-auto">
          <TickerSearch variant="header" />
        </div>
      </div>
    </header>
  );
}