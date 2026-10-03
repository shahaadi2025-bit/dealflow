"""Small dependency-free PDF writer with real pagination and basic styling, so we
avoid a heavy PDF library on a free hosting tier while still producing a document
that doesn't silently truncate past one page.

Usage: build a list of blocks, call render(blocks) -> bytes.
Block types: title, heading, body, rule, spacer.
"""
from __future__ import annotations

PAGE_W, PAGE_H = 612, 792
MARGIN_X, MARGIN_TOP, MARGIN_BOTTOM = 56, 56, 56
ACCENT = (0.753, 0.541, 0.180)  # #C08A2E as 0..1 RGB
INK = (0.08, 0.08, 0.09)
DIM = (0.45, 0.47, 0.5)

FONT_SIZES = {"title": 20, "heading": 12, "body": 10.5, "footer": 8}
LINE_HEIGHTS = {"title": 26, "heading": 18, "body": 15, "footer": 10}


def _esc(s: str) -> str:
    return s.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


def _wrap(text: str, max_chars: int) -> list[str]:
    words, line, out = text.split(), "", []
    for w in words:
        if len(line) + len(w) + 1 > max_chars:
            out.append(line)
            line = w
        else:
            line = f"{line} {w}".strip()
    if line:
        out.append(line)
    return out or [""]


def render(blocks: list[dict], footer_text: str = "DealFlow") -> bytes:
    pages: list[list[str]] = []
    cur: list[str] = []
    y = PAGE_H - MARGIN_TOP

    def new_page():
        nonlocal cur, y
        if cur:
            pages.append(cur)
        cur = []
        y = PAGE_H - MARGIN_TOP

    def ensure_space(needed: float):
        if y - needed < MARGIN_BOTTOM:
            new_page()

    def set_color(rgb):
        cur.append(f"{rgb[0]:.3f} {rgb[1]:.3f} {rgb[2]:.3f} rg")

    def draw_text(text: str, size: float, rgb, bold: bool):
        nonlocal y
        font = "/F2" if bold else "/F1"
        cur.append("BT")
        set_color(rgb)
        cur.append(f"{font} {size} Tf")
        cur.append(f"{MARGIN_X} {y:.1f} Td")
        cur.append(f"({_esc(text)}) Tj")
        cur.append("ET")

    def draw_rule():
        nonlocal y
        cur.append(f"{ACCENT[0]:.3f} {ACCENT[1]:.3f} {ACCENT[2]:.3f} RG")
        cur.append(f"{MARGIN_X} {y:.1f} m {PAGE_W - MARGIN_X} {y:.1f} l S")

    for block in blocks:
        kind = block["type"]
        if kind == "title":
            size, lh = FONT_SIZES["title"], LINE_HEIGHTS["title"]
            ensure_space(lh)
            draw_text(block["text"], size, INK, bold=True)
            y -= lh
        elif kind == "heading":
            size, lh = FONT_SIZES["heading"], LINE_HEIGHTS["heading"]
            ensure_space(lh + 4)
            draw_text(block["text"].upper(), size, ACCENT, bold=True)
            y -= lh
        elif kind == "body":
            size, lh = FONT_SIZES["body"], LINE_HEIGHTS["body"]
            for line in _wrap(block["text"], 92):
                ensure_space(lh)
                draw_text(line, size, INK, bold=False)
                y -= lh
        elif kind == "rule":
            ensure_space(10)
            draw_rule()
            y -= 14
        elif kind == "spacer":
            y -= block.get("height", 10)

    if cur:
        pages.append(cur)
    if not pages:
        pages = [[]]

    return _assemble_pdf(pages, footer_text)


def _assemble_pdf(pages: list[list[str]], footer_text: str) -> bytes:
    n = len(pages)
    objs: list[bytes] = []

    objs.append(b"<</Type/Catalog/Pages 2 0 R>>")  # 1: catalog
    kids = " ".join(f"{3 + i} 0 R" for i in range(n))
    objs.append(f"<</Type/Pages/Kids[{kids}]/Count {n}>>".encode())  # 2: pages

    content_obj_start = 3 + n
    font_regular_obj = content_obj_start + n
    font_bold_obj = font_regular_obj + 1

    for i in range(n):
        objs.append(
            f"<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 {font_regular_obj} 0 R/F2 {font_bold_obj} 0 R>>>>"
            f"/MediaBox[0 0 {PAGE_W} {PAGE_H}]/Contents {content_obj_start + i} 0 R>>".encode()
        )

    for i, page_ops in enumerate(pages):
        page_num_text = f"{footer_text}  -  page {i + 1} of {n}"
        ops = list(page_ops)
        ops.append("BT")
        ops.append(f"{DIM[0]:.3f} {DIM[1]:.3f} {DIM[2]:.3f} rg")
        ops.append(f"/F1 {FONT_SIZES['footer']} Tf")
        ops.append(f"{MARGIN_X} {MARGIN_BOTTOM - 24} Td")
        ops.append(f"({_esc(page_num_text)}) Tj")
        ops.append("ET")
        stream = "\n".join(ops).encode()
        objs.append(b"<</Length " + str(len(stream)).encode() + b">>stream\n" + stream + b"\nendstream")

    objs.append(b"<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>")
    objs.append(b"<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold>>")

    out = b"%PDF-1.4\n"
    offsets = []
    for idx, body in enumerate(objs, start=1):
        offsets.append(len(out))
        out += f"{idx} 0 obj".encode() + body + b"endobj\n"
    xref_off = len(out)
    out += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010} 00000 n \n".encode()
    out += f"trailer<</Size {len(objs) + 1}/Root 1 0 R>>\nstartxref\n{xref_off}\n%%EOF".encode()
    return out