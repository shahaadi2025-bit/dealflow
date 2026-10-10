"""Accumulating deal database: detected deals are merged into data/deals_history.json by a scheduled job."""
from __future__ import annotations
import hashlib, json, os
from collections import defaultdict
from pathlib import Path

HISTORY_PATH = Path(__file__).resolve().parents[2] / "data" / "deals_history.json"
MAX_RECORDS = 5000


def deal_id(item: dict) -> str:
    d = item.get("deal") or {}
    key = f"{(d.get('acquirer') or '').lower()}|{(d.get('target') or '').lower()}" if d.get("acquirer") and d.get("target") \
        else item["title"].lower()[:90]
    return hashlib.sha1(key.encode()).hexdigest()[:12]


def to_record(item: dict) -> dict:
    d = item.get("deal") or {}
    return {"id": deal_id(item), "title": item["title"], "link": item["link"], "source": item.get("source"),
            "published": item.get("published"), "status": d.get("status"), "type": d.get("type"),
            "value_musd": d.get("value_musd"), "acquirer": d.get("acquirer"), "target": d.get("target"),
            "tickers": item.get("tickers", []), "sectors": item.get("sectors", [])}


def load(path: Path | None = None) -> list[dict]:
    p = path or HISTORY_PATH
    try:
        return json.loads(p.read_text(encoding="utf-8-sig"))
    except Exception:
        return []


def merge(existing: list[dict], items: list[dict]) -> list[dict]:
    by = {r["id"]: r for r in existing}
    for it in items:
        r = to_record(it)
        old = by.get(r["id"])
        if old:  # keep first-seen link/date, upgrade status/value when newly known
            for k in ("status", "value_musd", "acquirer", "target"):
                if r.get(k) and (not old.get(k) or k == "status"):
                    old[k] = r[k]
            old["sectors"] = old.get("sectors") or r["sectors"]
        else:
            by[r["id"]] = r
    out = sorted(by.values(), key=lambda r: r.get("published") or "", reverse=True)
    return out[:MAX_RECORDS]


def save(records: list[dict], path: Path | None = None) -> None:
    p = path or HISTORY_PATH
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(records, separators=(",", ":")), encoding="utf-8")
    os.replace(tmp, p)


def league(records: list[dict], by: str = "acquirer", top: int = 15) -> list[dict]:
    agg: dict = defaultdict(lambda: {"count": 0, "value_musd": 0.0})
    for r in records:
        k = r.get(by)
        if not k:
            continue
        agg[k]["count"] += 1
        agg[k]["value_musd"] += r.get("value_musd") or 0
    rows = [{"name": k, **v} for k, v in agg.items()]
    rows.sort(key=lambda r: (r["value_musd"], r["count"]), reverse=True)
    return rows[:top]


def summary(records: list[dict]) -> dict:
    by_sector: dict = defaultdict(lambda: {"count": 0, "value_musd": 0.0})
    for r in records:
        for s in (r.get("sectors") or [])[:1]:
            by_sector[s]["count"] += 1
            by_sector[s]["value_musd"] += r.get("value_musd") or 0
    return {"total": len(records), "disclosed_value_musd": sum(r.get("value_musd") or 0 for r in records),
            "by_sector": sorted([{"sector": k, **v} for k, v in by_sector.items()], key=lambda x: -x["count"])}
