"""Retrieval corpus (deal archive + news archive) and search with recency and ticker boosts."""
from __future__ import annotations
import hashlib, json, math, re
from datetime import datetime, timezone
from pathlib import Path
from app.news import history
from app.rag.bm25 import BM25, tokenize

NEWS_PATH = Path(__file__).resolve().parents[2] / "data" / "news_archive.json"
MAX_NEWS = 4000
KEEP_DAYS = 90
_CACHE: dict = {"key": None, "docs": [], "bm": None}


def _read(p: Path) -> list[dict]:
    try:
        return json.loads(p.read_text(encoding="utf-8-sig"))
    except Exception:
        return []


def news_id(link: str, title: str) -> str:
    return hashlib.sha1((link or title).encode()).hexdigest()[:12]


def to_news_record(item: dict) -> dict:
    return {"id": news_id(item.get("link", ""), item["title"]), "title": item["title"], "summary": (item.get("summary") or "")[:300],
            "link": item.get("link"), "source": item.get("source"), "published": item.get("published"),
            "tickers": item.get("tickers", []), "sectors": item.get("sectors", [])}


def merge_news(existing: list[dict], items: list[dict], now: datetime | None = None) -> list[dict]:
    now = now or datetime.now(timezone.utc)
    by = {r["id"]: r for r in existing}
    for it in items:
        if it.get("title") and it.get("link"):
            r = to_news_record(it)
            by.setdefault(r["id"], r)
    out = [r for r in by.values() if _age_days(r.get("published"), now) <= KEEP_DAYS]
    out.sort(key=lambda r: r.get("published") or "", reverse=True)
    return out[:MAX_NEWS]


def save_news(records: list[dict], path: Path | None = None) -> None:
    p = path or NEWS_PATH
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(records, separators=(",", ":")), encoding="utf-8")
    tmp.replace(p)


def _age_days(iso: str | None, now: datetime) -> float:
    if not iso:
        return 365.0
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return max(0.0, (now - d).total_seconds() / 86400)
    except Exception:
        return 365.0


def _docs() -> list[dict]:
    docs = []
    for r in history.load():
        parts = [r["title"]]
        if r.get("acquirer") and r.get("target"):
            parts.append(f"{r['acquirer']} acquires {r['target']}")
        if r.get("status"):
            parts.append(r["status"])
        if r.get("value_musd"):
            parts.append(f"${r['value_musd']:,.0f} million deal")
        docs.append({"id": "d" + r["id"], "kind": "deal", "title": r["title"], "text": " ".join(parts), "link": r.get("link"),
                     "source": r.get("source"), "published": r.get("published"), "tickers": r.get("tickers") or [], "sectors": r.get("sectors") or []})
    for r in _read(NEWS_PATH):
        docs.append({"id": "n" + r["id"], "kind": "news", "title": r["title"], "text": r["title"] + " " + (r.get("summary") or ""),
                     "link": r.get("link"), "source": r.get("source"), "published": r.get("published"),
                     "tickers": r.get("tickers") or [], "sectors": r.get("sectors") or []})
    return docs


def _file_key() -> tuple:
    out = []
    for p in (history.HISTORY_PATH, NEWS_PATH):
        try:
            s = p.stat()
            out.append((s.st_mtime_ns, s.st_size))
        except OSError:
            out.append(None)
    return tuple(out)


def index() -> tuple[list[dict], BM25 | None]:
    key = _file_key()
    if _CACHE["key"] != key:
        docs = _docs()
        _CACHE.update(key=key, docs=docs, bm=BM25([tokenize(d["text"]) for d in docs]) if docs else None)
    return _CACHE["docs"], _CACHE["bm"]


def search(query: str, k: int = 6, tickers: list[str] | None = None, sector: str | None = None, now: datetime | None = None) -> list[dict]:
    docs, bm = index()
    if not bm:
        return []
    now = now or datetime.now(timezone.utc)
    tickers = [t.upper() for t in (tickers or [])]
    q = tokenize(query + " " + " ".join(tickers))
    raw = bm.scores(q)
    ranked = []
    for i, s in raw.items():
        d = docs[i]
        boost = 0.7 + 0.3 * math.exp(-_age_days(d["published"], now) / 45)
        if tickers and set(tickers) & set(d["tickers"]):
            boost *= 1.6
        if sector and sector in d["sectors"]:
            boost *= 1.2
        ranked.append((s * boost, i))
    ranked.sort(reverse=True)
    out, seen = [], set()
    for score, i in ranked:
        d = docs[i]
        sig = re.sub(r"\W+", " ", d["title"].lower())[:60]
        if sig in seen:
            continue
        seen.add(sig)
        out.append({**d, "score": round(score, 3)})
        if len(out) >= k:
            break
    return out
