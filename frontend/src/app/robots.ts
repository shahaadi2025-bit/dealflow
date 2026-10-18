import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://dealflow-rho.vercel.app";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/billing/"] }],
    sitemap: `${base}/sitemap.xml`, host: base,
  };
}
