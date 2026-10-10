import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/CommandPalette";
import { Backdrop } from "@/components/Backdrop";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "DealFlow - M&A Screener, Live Deals & News",
  description: "Screen acquisition targets across 29 sectors, track live M&A deals and news, run DCF and comps valuation, and generate investment memos.",
  icons: { icon: "/favicon.svg" },
};

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem("dealflow:theme");
    if (saved === "light") document.documentElement.setAttribute("data-theme", "light");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans text-[14px] antialiased">
        <Providers>
          <Backdrop />
          <CommandPalette />
          <SiteHeader />
          <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 relative">
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