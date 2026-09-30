"""One-pager valuation report as text-only PDF, reusing the lightweight PDF writer."""
from app.memo.pdf import _wrap, _simple_pdf


def valuation_to_pdf_bytes(company_name: str, ticker: str, v: dict) -> bytes:
    c = v["company"]
    dcf = v["dcf"]
    lines = [f"DealFlow Valuation Report: {company_name} ({ticker})", f"As of {c.get('as_of', '')}", ""]

    lines.append("COMPANY SNAPSHOT")
    lines.append(f"Price: ${c.get('price', 0):.2f}   Market cap: ${c.get('market_cap', 0)/1e9:.2f}B")
    rev = c.get("revenue")
    lines.append(f"Revenue: ${rev/1e9:.2f}B" if rev else "Revenue: n/a")
    gm = c.get("gross_margin")
    lines.append(f"Gross margin: {gm*100:.1f}%" if gm is not None else "Gross margin: n/a")
    lines.append("")

    lines.append("DCF VALUATION")
    lines.append(f"Enterprise value: ${dcf.get('ev', 0)/1e9:.2f}B")
    lines.append(f"Equity value: ${dcf.get('equity', 0)/1e9:.2f}B")
    lines.append(f"Value per share: ${dcf.get('per_share', 0):.2f}")
    a = v["assumptions"]
    lines.append(f"WACC: {a.get('wacc', 0)*100:.1f}%   Terminal growth: {a.get('terminal_g', 0)*100:.1f}%")
    lines.append("")

    lines.append("VALUATION RANGES (per share)")
    for bar in v.get("football", []):
        lines += _wrap(f"{bar['label']}: ${bar['low']:.2f} - ${bar['high']:.2f}", 95)
    lines.append("")

    lines.append("COMPARABLE COMPANIES")
    for p in v.get("comps", {}).get("peers", [])[:10]:
        evr = p.get("ev_rev")
        lines.append(f"{p['ticker']}: EV/Rev {evr:.1f}x" if evr else f"{p['ticker']}: n/a")
    lines.append("")
    lines.append("Figures are modeled estimates from public market data. Not investment advice.")

    return _simple_pdf(lines)