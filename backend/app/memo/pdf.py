from app.memo.pdfkit import render


def memo_to_pdf_bytes(company_name: str, memo: dict) -> bytes:
    sections = [
        ("Executive Summary", memo.get("executive_summary", "")),
        ("Business Overview", memo.get("business_overview", "")),
        ("Financial Analysis", memo.get("financial_analysis", "")),
        ("Valuation Summary", memo.get("valuation_summary", "")),
        ("Key Risks", memo.get("key_risks", "")),
        ("Recommendation", memo.get("recommendation", "")),
    ]
    blocks = [
        {"type": "title", "text": f"Investment Memo: {company_name}"},
        {"type": "spacer", "height": 18},
    ]
    for title, body in sections:
        blocks.append({"type": "heading", "text": title})
        blocks.append({"type": "rule"})
        blocks.append({"type": "body", "text": body or "Not available."})
        blocks.append({"type": "spacer", "height": 16})
    return render(blocks, footer_text=f"DealFlow - {company_name}")