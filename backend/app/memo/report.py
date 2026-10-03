"""One-pager (now multi-page-safe) valuation report, styled via pdfkit."""
from app.memo.pdfkit import render


def valuation_to_pdf_bytes(company_name: str, ticker: str, v: dict) -> bytes:
    c = v["company"]
    dcf = v["dcf"]
    a = v["assumptions"]

    blocks = [
        {"type": "title", "text": f"DealFlow Valuation Report: {company_name} ({ticker})"},
        {"type": "body", "text": f"As of {c.get('as_of', '')}"},
        {"type": "spacer", "height": 18},
    ]

    blocks.append({"type": "heading", "text": "Company Snapshot"})
    blocks.append({"type": "rule"})
    price = c.get("price", 0) or 0
    mcap = (c.get("market_cap", 0) or 0) / 1e9
    blocks.append({"type": "body", "text": f"Price: ${price:.2f}    Market cap: ${mcap:.2f}B"})
    rev = c.get("revenue")
    blocks.append({"type": "body", "text": f"Revenue: ${rev/1e9:.2f}B" if rev else "Revenue: n/a"})
    gm = c.get("gross_margin")
    blocks.append({"type": "body", "text": f"Gross margin: {gm*100:.1f}%" if gm is not None else "Gross margin: n/a"})
    blocks.append({"type": "spacer", "height": 14})

    blocks.append({"type": "heading", "text": "DCF Valuation"})
    blocks.append({"type": "rule"})
    blocks.append({"type": "body", "text": f"Enterprise value: ${dcf.get('ev', 0)/1e9:.2f}B"})
    blocks.append({"type": "body", "text": f"Equity value: ${dcf.get('equity', 0)/1e9:.2f}B"})
    blocks.append({"type": "body", "text": f"Value per share: ${dcf.get('per_share', 0):.2f}"})
    blocks.append({"type": "body", "text": f"WACC: {a.get('wacc', 0)*100:.1f}%    Terminal growth: {a.get('terminal_g', 0)*100:.1f}%"})
    blocks.append({"type": "spacer", "height": 14})

    blocks.append({"type": "heading", "text": "Valuation Ranges (per share)"})
    blocks.append({"type": "rule"})
    for bar in v.get("football", []):
        blocks.append({"type": "body", "text": f"{bar['label']}: ${bar['low']:.2f} - ${bar['high']:.2f}"})
    blocks.append({"type": "spacer", "height": 14})

    blocks.append({"type": "heading", "text": "Comparable Companies"})
    blocks.append({"type": "rule"})
    for p in v.get("comps", {}).get("peers", [])[:12]:
        evr = p.get("ev_rev")
        blocks.append({"type": "body", "text": f"{p['ticker']}: EV/Rev {evr:.1f}x" if evr else f"{p['ticker']}: n/a"})
    blocks.append({"type": "spacer", "height": 18})

    blocks.append({"type": "body", "text": "Figures are modeled estimates from public market data. Not investment advice."})

    return render(blocks, footer_text=f"DealFlow - {ticker}")