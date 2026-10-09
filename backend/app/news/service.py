"""News, live-deal and market-tape services built on feeds + analysis."""
from __future__ import annotations
import re, time, logging
from collections import Counter
from datetime import datetime, timezone

from app.data.sectors import SECTOR_META
from app.news import feeds
from app.news.analysis import enrich, strip_source_suffix

log = logging.getLogger("news")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _age_minutes(iso: str | None) -> int | None:
    if not iso:
        return None
    try:
        return max(0, int((_now() - datetime.fromisoformat(iso)).total_seconds() // 60))
    except Exception:
        return None


def _key(title: str) -> set[str]:
    words = re.findall(r"[a-z0-9]{3,}", title.lower())
    return set(words)


def dedupe(items: list[dict]) -> list[dict]:
    """Collapse the same story reported by several outlets; keep the earliest, count the rest."""
    items = sorted(items, key=lambda i: i.get("published") or "")
    kept: list[dict] = []
    keys: list[set[str]] = []
    for it in items:
        k = _key(it["title"])
        if not k:
            continue
        dup = None
        for j, kk in enumerate(keys):
            inter = len(k & kk)
            if inter / max(1, min(len(k), len(kk))) >= 0.7 and inter >= 4:
                dup = j
                break
        if dup is None:
            it["also_reported_by"] = []
            kept.append(it)
            keys.append(k)
        else:
            src = it.get("source")
            base = kept[dup]
            if src and src != base.get("source") and src not in base["also_reported_by"]:
                base["also_reported_by"].append(src)
    return kept


def _finish(items: list[dict]) -> list[dict]:
    out = []
    for it in items:
        it["title"] = strip_source_suffix(it["title"], it.get("source", ""))
        it = enrich(it)
        it["age_minutes"] = _age_minutes(it.get("published"))
        out.append(it)
    out.sort(key=lambda i: i.get("published") or "", reverse=True)
    return out


def market_news(limit: int = 60, sector: str | None = None, sentiment: str | None = None,
                deals_only: bool = False, q: str | None = None) -> dict:
    jobs = [lambda u=u, s=s: feeds.load_feed(u, s, 300) for u, s in feeds.MARKET_FEEDS]
    jobs.append(lambda: feeds.google_news("stock market OR earnings OR Wall Street", "1d", 300))
    jobs.append(lambda: feeds.google_news("acquisition OR merger OR takeover announced", "2d", 300))
    if sector and sector in SECTOR_META:
        jobs.append(lambda: feeds.google_news(f"({SECTOR_META[sector]['q']}) AND (stocks OR earnings OR acquisition)", "3d", 600))
    flat = [i for lst in feeds.fetch_many(jobs) for i in lst]
    items = _finish(dedupe(flat))
    if sector:
        items = [i for i in items if sector in i["sectors"]]
    if sentiment:
        items = [i for i in items if i["sentiment"]["label"] == sentiment]
    if deals_only:
        items = [i for i in items if i["is_deal"]]
    if q:
        ql = q.lower()
        items = [i for i in items if ql in i["title"].lower() or ql.upper() in i["tickers"]]
    items = items[:limit]
    return {"updated": _now().isoformat(), "count": len(items), "items": items, "mood": mood(items)}


def ticker_news(ticker: str, name: str | None = None, limit: int = 25) -> dict:
    t = ticker.upper()
    q = f'"{name}" OR {t} stock' if name else f"{t} stock"
    jobs = [lambda: feeds.yahoo_ticker_news(t, 300), lambda: feeds.google_news(q, "14d", 600)]
    flat = [i for lst in feeds.fetch_many(jobs) for i in lst]
    items = _finish(dedupe(flat))
    for i in items:  # pin the requested ticker as a tagged ticker
        if t not in i["tickers"]:
            i["tickers"].insert(0, t)
    items = items[:limit]
    return {"ticker": t, "updated": _now().isoformat(), "count": len(items), "items": items, "mood": mood(items)}


def mood(items: list[dict]) -> dict:
    if not items:
        return {"score": 0.0, "label": "neutral", "bullish": 0, "bearish": 0, "neutral": 0}
    c = Counter(i["sentiment"]["label"] for i in items)
    n = len(items)
    score = (c["bullish"] - c["bearish"]) / n
    label = "bullish" if score > 0.1 else "bearish" if score < -0.1 else "neutral"
    return {"score": round(score, 2), "label": label, "bullish": c["bullish"], "bearish": c["bearish"], "neutral": c["neutral"]}


def trending(items: list[dict], top: int = 12) -> list[dict]:
    c: Counter = Counter()
    sent: dict[str, float] = {}
    for i in items:
        for t in i["tickers"]:
            c[t] += 1
            sent[t] = sent.get(t, 0.0) + i["sentiment"]["score"]
    return [{"ticker": t, "mentions": n, "sentiment": round(sent[t] / n, 2)} for t, n in c.most_common(top) if n >= 2]


def trending_tickers() -> dict:
    data = market_news(limit=200)
    return {"updated": data["updated"], "tickers": trending(data["items"])}


def live_deals(sector: str | None = None, days: int = 7, limit: int = 80) -> dict:
    """Latest M&A headlines, deduped, with deal metadata. Refreshes every 5-10 minutes."""
    when = f"{max(1, min(days, 30))}d"
    queries = [
        '("to acquire" OR "agrees to buy" OR "takeover" OR "merger agreement" OR "tender offer" OR "take private")',
        '("acquisition" OR "buyout") ("billion" OR "million") announced',
    ]
    if sector and sector in SECTOR_META:
        queries = [f"({SECTOR_META[sector]['q']}) AND (acquire OR acquisition OR merger OR takeover OR buyout)"]
    else:
        # one broad sweep + a rotating spread of sector sweeps so every sector gets coverage
        for s, m in SECTOR_META.items():
            queries.append(f"({m['q']}) AND (acquire OR acquisition OR merger OR takeover)")
    jobs = [lambda q=q: feeds.google_news(q, when, 600) for q in queries]
    flat = [i for lst in feeds.fetch_many(jobs) for i in lst]
    items = [i for i in _finish(dedupe(flat)) if i["is_deal"]]
    if sector:
        for i in items:
            if sector not in i["sectors"]:
                i["sectors"].insert(0, sector)
    items = items[:limit]
    by_sector = Counter(s for i in items for s in i["sectors"][:1])
    total_value = sum((i["deal"]["value_musd"] or 0) for i in items)
    status = Counter(i["deal"]["status"] for i in items)
    return {
        "updated": _now().isoformat(), "days": days, "count": len(items), "items": items,
        "stats": {
            "by_sector": [{"sector": s, "count": n} for s, n in by_sector.most_common()],
            "disclosed_value_musd": total_value, "status": dict(status),
        },
    }


def sec_deal_filings(limit: int = 60) -> dict:
    jobs = [lambda f=f: feeds.sec_filings(f) for f in feeds.SEC_FORMS]
    results = feeds.fetch_many(jobs)
    items: list[dict] = []
    for form, lst in zip(feeds.SEC_FORMS, results):
        for it in lst:
            items.append({
                "form": form, "form_label": feeds.SEC_FORMS[form],
                "company": it.get("company") or re.sub(r"^.*?-\s*", "", it["title"]),
                "role": it.get("role"), "link": it["link"], "published": it.get("published"),
                "age_minutes": _age_minutes(it.get("published")),
            })
    items.sort(key=lambda i: i["published"] or "", reverse=True)
    return {"updated": _now().isoformat(), "count": len(items[:limit]), "items": items[:limit]}


# ---------------- market tape (indices etc.), 60s cache ----------------
TAPE = [("^GSPC", "S&P 500"), ("^IXIC", "Nasdaq"), ("^DJI", "Dow"), ("^RUT", "Russell 2000"), ("^VIX", "VIX"),
        ("^TNX", "US 10Y"), ("GC=F", "Gold"), ("CL=F", "WTI Oil"), ("BTC-USD", "Bitcoin"), ("EURUSD=X", "EUR/USD")]
_TAPE_CACHE: dict = {"t": 0.0, "data": []}


def _quote(sym_label):
    sym, label = sym_label
    import yfinance as yf
    fi = yf.Ticker(sym).fast_info
    last, prev = fi["last_price"], fi["previous_close"]
    if not last or not prev:
        return None
    return {"symbol": sym, "label": label, "price": round(float(last), 2), "change_pct": round((float(last) / float(prev) - 1) * 100, 2)}


def market_tape() -> dict:
    now = time.time()
    if now - _TAPE_CACHE["t"] < 60 and _TAPE_CACHE["data"]:
        return {"updated": _TAPE_CACHE["iso"], "items": _TAPE_CACHE["data"]}
    try:
        from concurrent.futures import ThreadPoolExecutor
        def safe(x):
            try:
                return _quote(x)
            except Exception:
                return None
        with ThreadPoolExecutor(max_workers=5) as ex:
            data = [q for q in ex.map(safe, TAPE) if q]
        if data:
            _TAPE_CACHE.update(t=now, data=data, iso=_now().isoformat())
    except Exception as e:  # pragma: no cover
        log.warning("tape failed: %s", e)
    return {"updated": _TAPE_CACHE.get("iso"), "items": _TAPE_CACHE["data"]}
