import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acquisition Target Screener | DealFlow",
  description: "Score and rank acquisition targets in any of 29 sectors by growth, margins and valuation.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
