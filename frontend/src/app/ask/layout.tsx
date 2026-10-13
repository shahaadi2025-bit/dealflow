import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask DealFlow | DealFlow",
  description: "Ask questions about companies, sectors and deals and get answers grounded in DealFlow data.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
