import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl font-semibold tracking-tight text-ink">DealFlow</span>
          <span className="text-dim text-[11px] tracking-wide">deal screener</span>
        </Link>
        <nav className="flex items-center gap-6 text-[12px] text-dim">
          <Link href="/" className="hover:text-ink transition-colors">Screener</Link>
          <span className="text-line">/</span>
          <span>DCF · Comps · Memo</span>
        </nav>
      </div>
    </header>
  );
}
