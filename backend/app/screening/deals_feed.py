"""Exposes the historical deals dataset (used to train the ML model) as a readable
reference feed -- the DealFlow analogue of a "recent comparable transactions" or
M&A league table page."""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HISTORICAL = ROOT / "data" / "historical_deals.csv"


def list_deals() -> list[dict]:
    if not HISTORICAL.exists():
        return []
    rows = []
    with open(HISTORICAL, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            if row.get("label") != "1":
                continue
            rows.append({
                "ticker": row["ticker"],
                "ev_rev": float(row["ev_rev"]),
                "growth": float(row["growth"]),
                "confidence": row.get("confidence", "medium"),
                "note": row.get("deal_note", ""),
            })
    rows.sort(key=lambda r: r["ev_rev"], reverse=True)
    return rows