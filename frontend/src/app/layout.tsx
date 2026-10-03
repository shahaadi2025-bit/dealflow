import type { Metadata } from "next";
import { Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/CommandPalette";

const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", weight: ["400", "600", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "DealFlow - M&A Deal Screener & Valuation",
  description: "Screen acquisition targets, run DCF and comps valuation, and generate investment memos.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen font-mono text-[13px] antialiased">
        <Providers>
          <CommandPalette />
          <SiteHeader />
          <main className="mx-auto max-w-[1400px] px-6 py-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <footer className="mx-auto max-w-[1400px] px-6 py-10 text-dim text-xs border-t border-line mt-16">
            Figures are modeled estimates from public market data for research and educational purposes. Not investment advice.
          </footer>
        </Providers>
      </body>
    </html>
  );
}