import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deal Pipeline | DealFlow",
  description: "Track targets from watching to shortlisted. Saved in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
