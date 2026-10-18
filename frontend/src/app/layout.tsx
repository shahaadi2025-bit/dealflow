import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/CommandPalette";
import { Backdrop } from "@/components/Backdrop";
import { DealAlerts } from "@/components/DealAlerts";
import { RegisterSW } from "@/components/RegisterSW";
import { DataStamp } from "@/components/DataStamp";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "DealFlow - M&A Screener, Live Deals & News",
  description: "Screen acquisition targets across 29 sectors, track live M&A deals and news, run DCF and comps valuation, and generate investment memos.",
  icons: { icon: "/favicon.svg" },
  alternates: { canonical: "/" },
  applicationName: "DealFlow",
  keywords: ["M&A screener", "acquisition targets", "deal flow", "DCF valuation", "precedent transactions", "merger model", "LBO", "take-private", "live M&A deals"],
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dealflow-rho.vercel.app"),
  openGraph: { title: "DealFlow - M&A Screener, Live Deals & News", description: "Screen targets across 29 sectors, track live M&A deals, value companies and draft memos. Free.", type: "website", images: ["/og.png"] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "DealFlow", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#080808" };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://dealflow-rho.vercel.app";
const SITE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "DealFlow", url: SITE, description: "Free M&A screener, live deal wire and valuation tools across 29 sectors." },
    { "@type": "WebApplication", name: "DealFlow", url: SITE, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
  ],
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_LD) }} />
      </head>
      <body className="min-h-screen font-sans text-[14px] antialiased">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-signal focus:text-bg focus:px-3 focus:py-2 focus:rounded-lg">Skip to content</a>
          <Backdrop />
          <DealAlerts />
          <RegisterSW />
          <CommandPalette />
          <SiteHeader />
          <main id="main" className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 relative">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <footer className="mx-auto max-w-[1400px] px-6 py-10 text-dim text-xs border-t border-line mt-16">
            Figures are modeled estimates from public market data for research and educational purposes. Not investment advice.
            <DataStamp />
            <a href="/status" className="block mt-2 hover:text-signal w-fit">System status</a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}