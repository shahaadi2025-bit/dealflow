import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { ticker: string } }): Promise<Metadata> {
  const t = decodeURIComponent(params.ticker).toUpperCase().slice(0, 12);
  const title = `${t} acquisition analysis | DealFlow`;
  const description = `Valuation range, DCF, comps, likely buyers and LBO check for ${t}. Free M&A screening on DealFlow.`;
  return { title, description, openGraph: { title, description, images: ["/og.png"] }, twitter: { card: "summary_large_image", title, description, images: ["/og.png"] } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
