import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sector Benchmarks | DealFlow",
  description: "Compare growth, margins and valuation multiples across 29 sectors.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
