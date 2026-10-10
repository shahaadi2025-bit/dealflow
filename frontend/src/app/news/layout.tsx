import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market News Dashboard | DealFlow",
  description: "Financial news for every tracked company with sentiment, trending tickers and deal detection.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
