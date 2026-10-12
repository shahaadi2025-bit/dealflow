"""Deal detail, implied multiples and precedent transactions. Pure functions over deal records + the snapshot."""
from __future__ import annotations
import re, statistics
from app.data.fetch import load_snapshot
from app.news import analysis


def resolve_ticker(name: str | None) -> str | None:
    """Map a company name from a headline to a tracked ticker, or None when unsure."""
    if not name:
        return None
    idx, known = analysis._name_index()
    n = analysis._norm_name(name)
    if not n:
        return None
    if n in idx:
        return idx[n]
    if name.upper() in known and len(name) >= 3:
        return name.upper()
    if len(n) < 5:  # too short to match safely (e.g. "B" must never match "...(D/B/A)")
        return None
    for key, tk in idx.items():  # "Dayforce Inc" vs "dayforce": allow whole-word containment of a distinctive name
        if len(key) >= 5 and (re.search(rf"\b{re.escape(key)}\b", n) or re.search(rf"\b{re.escape(n)}\b", key)):
            return tk
    return None


def implied(record: dict) -> dict | None:
    """Deal value / revenue and premium to market cap for a record whose target is a tracked company."""
    v = record.get("value_musd")
    tk = record.get("target_ticker") or resolve_ticker(record.get("target"))
    if not v or not tk:
        return None
    f = load_snapshot().get(tk)
    if not f or not f.revenue or f.revenue <= 0:
        return None
    value = v * 1e6
    out = {"ticker": tk, "name": f.name, "deal_value": value, "revenue": f.revenue, "ev_rev": round(value / f.revenue, 2),
           "market_cap": f.market_cap}
    if f.market_cap:
        out["premium_to_market_cap"] = round(value / f.market_cap - 1, 3)
    if f.ebitda and f.ebitda > 0:
        out["ev_ebitda"] = round(value / f.ebitda, 1)
    return out


def precedents(records: list[dict], sector: str | None = None) -> dict:
    rows = []
    for r in records:
        if r.get("status") not in ("announced", "completed"):
            continue
        if sector and sector not in (r.get("sectors") or []):
            continue
        imp = implied(r)
        if not imp or imp["ev_rev"] <= 0 or imp["ev_rev"] > 80:
            continue
        rows.append({"id": r.get("id"), "title": r["title"], "link": r.get("link"), "published": r.get("published"),
                     "acquirer": r.get("acquirer"), "target": r.get("target"), "status": r.get("status"),
                     "sectors": r.get("sectors") or [], **imp})
    mult = sorted(x["ev_rev"] for x in rows)
    stats = None
    if mult:
        q = lambda p: mult[min(len(mult) - 1, int(p * (len(mult) - 1) + 0.5))]
        stats = {"n": len(mult), "median": round(statistics.median(mult), 2), "p25": q(0.25), "p75": q(0.75)}
    return {"sector": sector, "stats": stats, "items": rows[:50]}
