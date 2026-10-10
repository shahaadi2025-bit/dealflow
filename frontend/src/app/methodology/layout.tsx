import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology | DealFlow",
  description: "How DealFlow scores targets and values companies.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
