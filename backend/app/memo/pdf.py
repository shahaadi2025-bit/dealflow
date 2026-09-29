"""Very small dependency-free PDF export (text-only) so we don't need a heavy PDF lib on a free tier."""
def memo_to_pdf_bytes(company_name: str, memo: dict) -> bytes:
    sections = [
        ("Executive Summary", memo.get("executive_summary", "")),
        ("Business Overview", memo.get("business_overview", "")),
        ("Financial Analysis", memo.get("financial_analysis", "")),
        ("Valuation Summary", memo.get("valuation_summary", "")),
        ("Key Risks", memo.get("key_risks", "")),
        ("Recommendation", memo.get("recommendation", "")),
    ]
    lines = [f"Investment Memo: {company_name}", ""]
    for title, body in sections:
        lines.append(title.upper())
        lines += _wrap(body, 95)
        lines.append("")
    return _simple_pdf(lines)


def _wrap(text, width):
    words, line, out = text.split(), "", []
    for w in words:
        if len(line) + len(w) + 1 > width:
            out.append(line); line = w
        else:
            line = f"{line} {w}".strip()
    if line: out.append(line)
    return out or [""]


def _simple_pdf(lines: list[str]) -> bytes:
    esc = lambda s: s.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
    y, content = 780, []
    content.append("BT /F1 11 Tf 50 800 Td")
    for line in lines:
        content.append(f"0 -14 Td ({esc(line)}) Tj")
    content.append("ET")
    stream = "\n".join(content).encode()
    objs = []
    objs.append(b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj")
    objs.append(b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj")
    objs.append(b"3 0 obj<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 5 0 R>>>>/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj")
    objs.append(b"4 0 obj<</Length " + str(len(stream)).encode() + b">>stream\n" + stream + b"\nendstream endobj")
    objs.append(b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj")
    out = b"%PDF-1.4\n"
    offsets = []
    for o in objs:
        offsets.append(len(out)); out += o + b"\n"
    xref_off = len(out)
    out += f"xref\n0 {len(objs)+1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010} 00000 n \n".encode()
    out += f"trailer<</Size {len(objs)+1}/Root 1 0 R>>\nstartxref\n{xref_off}\n%%EOF".encode()
    return out
