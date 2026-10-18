import type { Metadata } from "next";
import { SECTOR_BLURBS, SECTOR_LABELS } from "@/lib/sectors";

export async function generateMetadata({ params }: { params: { key: string } }): Promise<Metadata> {
  const label = SECTOR_LABELS[params.key];
  if (!label) return { title: "Sector not found | DealFlow", robots: { index: false } };
  const title = `${label} M&A: acquisition targets, deals and valuation multiples | DealFlow`;
  const description = `${SECTOR_BLURBS[params.key] ?? label}. Top-scoring ${label} acquisition targets, recent deals, precedent multiples and news. Free.`;
  return { title, description, alternates: { canonical: `/sector/${params.key}` }, openGraph: { title, description, images: ["/og.png"] } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
