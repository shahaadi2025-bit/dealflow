import type { Metadata } from "next";
import tickers from "@/lib/tickers.json";
import { SECTOR_LABELS } from "@/lib/sectors";

type T = { t: string; n: string; s: string };
const find = (raw: string): T | undefined => (tickers as T[]).find((x) => x.t === decodeURIComponent(raw).toUpperCase());
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://dealflow-rho.vercel.app";

export async function generateMetadata({ params }: { params: { ticker: string } }): Promise<Metadata> {
  const co = find(params.ticker);
  const sym = decodeURIComponent(params.ticker).toUpperCase().slice(0, 12);
  const name = co?.n ?? sym;
  const title = `${name} (${sym}) acquisition analysis, valuation and likely buyers | DealFlow`;
  const description = `Is ${name} (${sym}) a takeover target? DCF and comps valuation, takeover score, likely acquirers, LBO and merger models, precedent deals and insider filings. Free on DealFlow.`;
  return {
    title, description, alternates: { canonical: `/company/${sym}` },
    openGraph: { title, description, images: ["/og.png"], type: "article" },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default function Layout({ children, params }: { children: React.ReactNode; params: { ticker: string } }) {
  const co = find(params.ticker);
  const sym = decodeURIComponent(params.ticker).toUpperCase().slice(0, 12);
  const ld = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "DealFlow", item: SITE },
      ...(co ? [{ "@type": "ListItem", position: 2, name: SECTOR_LABELS[co.s] ?? co.s, item: `${SITE}/sector/${co.s}` }] : []),
      { "@type": "ListItem", position: co ? 3 : 2, name: co?.n ?? sym, item: `${SITE}/company/${sym}` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {co && (
        <p className="text-dim text-[12px] mb-3 max-w-3xl">
          {co.n} ({co.t}) is tracked in DealFlow&apos;s {SECTOR_LABELS[co.s] ?? co.s} universe. Below: valuation range, takeover attractiveness, likely buyers, precedent deals and ownership signals.
        </p>
      )}
      {children}
    </>
  );
}
