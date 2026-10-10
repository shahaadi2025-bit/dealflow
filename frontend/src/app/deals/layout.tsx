import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live M&A Deal Wire | DealFlow",
  description: "Latest mergers, acquisitions and SEC deal filings across 29 sectors, updated every minute.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
