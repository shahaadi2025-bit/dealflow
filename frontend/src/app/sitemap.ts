import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://dealflow-rho.vercel.app";
  return ["", "/screener", "/sectors", "/deals", "/news", "/compare", "/methodology", "/alerts", "/pipeline"].map((p) => ({
    url: `${base}${p}`, changeFrequency: p === "/deals" || p === "/news" ? "hourly" : "weekly", priority: p === "" ? 1 : 0.7,
  }));
}
