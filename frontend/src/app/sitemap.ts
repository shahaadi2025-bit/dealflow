import type { MetadataRoute } from "next";
import tickers from "@/lib/tickers.json";
import { SECTOR_ORDER } from "@/lib/sectors";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://dealflow-rho.vercel.app";
  const now = new Date();
  const top = ["", "/screener", "/deals", "/news", "/sectors", "/ask", "/compare", "/methodology"].map((p) => ({
    url: `${base}${p}`, lastModified: now, changeFrequency: (p === "/deals" || p === "/news" ? "hourly" : "weekly") as "hourly" | "weekly", priority: p === "" ? 1 : 0.8,
  }));
  const sectors = SECTOR_ORDER.map((s) => ({ url: `${base}/sector/${s}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 }));
  const companies = (tickers as { t: string }[]).map((x) => ({ url: `${base}/company/${encodeURIComponent(x.t)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.6 }));
  return [...top, ...sectors, ...companies];
}
