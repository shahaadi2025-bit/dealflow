"""GDELT DOC 2.0 (free, no key) as a fallback news source when RSS feeds are blocked."""
from __future__ import annotations
import json
from datetime import datetime, timezone
from urllib.parse import quote_plus

from app.news import feeds


def parse_gdelt(text: str) -> list[dict]:
    try:
        data = json.loads(text)
    except Exception:
        return []
    out = []
    for a in data.get("articles", []) or []:
        title = (a.get("title") or "").strip()
        url = a.get("url")
        if not title or not url:
            continue
        pub = None
        sd = a.get("seendate")  # 20261010T121500Z
        try:
            pub = datetime.strptime(sd, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc).isoformat()
        except Exception:
            pass
        out.append({"title": title, "link": url, "source": a.get("domain") or "GDELT", "published": pub, "summary": ""})
    return out


def gdelt_news(query: str, timespan: str = "2d", ttl: float = 600) -> list[dict]:
    url = ("https://api.gdeltproject.org/api/v2/doc/doc?query=" + quote_plus(query + " sourcelang:english")
           + f"&mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan={timespan}")
    return feeds.cached(url, ttl, lambda: parse_gdelt(feeds.fetch_text(url)))
