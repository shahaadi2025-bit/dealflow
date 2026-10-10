import { ImageResponse } from "next/og";

export const alt = "DealFlow - M&A screener, live deals and news";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80,
        background: "linear-gradient(135deg,#080d2c 0%,#1a2466 100%)", color: "#eef2ff" }}>
        <div style={{ fontSize: 30, color: "#ff8a3d", marginBottom: 20 }}>DealFlow</div>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>Find the next deal before the headline.</div>
        <div style={{ fontSize: 30, color: "#92a0d6", marginTop: 28 }}>Screening, live M&A wire, news and valuation. Free.</div>
      </div>
    ),
    size,
  );
}
