import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Companies | DealFlow",
  description: "Side-by-side valuation and financial comparison.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
