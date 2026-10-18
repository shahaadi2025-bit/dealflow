import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Deal Alerts | DealFlow",
  description: "Get notified when a new M&A deal matches your ticker, sector or size rules.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
