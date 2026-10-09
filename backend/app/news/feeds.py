"""RSS/Atom fetching with a TTL cache and stale-on-error fallback. No API keys needed.

Sources: Yahoo Finance, CNBC, MarketWatch, Google News RSS, SEC EDGAR (official, real-time
M&A forms). Every source fails soft: a blocked feed just contributes nothing.
"""
from __future__ import annotations
import logging, re, time, html
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus

import httpx

log = logging.getLogger("news")
UA = "Mozilla/5.0 (compatible; DealFlow/2.0; +https://github.com/shahaadi2025-bit/dealflow)"
SEC_UA = "DealFlow research app (educational project) contact: shah.aadi.2025@gmail.com"

_CACHE: dict[str, tuple[float, list[dict]]] = {}


def fetch_text(url: str, headers: dict | None = None, timeout: float = 8.0) -> str:
    h = {"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"}
    h.update(headers or {})
    r = httpx.get(url, headers=h, timeout=timeout, follow_redirects=True)
    r.raise_for_status()
    return r.text


def _strip_html(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", html.unescape(s or ""))
    return re.sub(r"\s+", " ", s).strip()


def _parse_date(s: str | None) -> datetime | None:
    if not s:
        return None
    s = s.strip()
    try:
        d = parsedate_to_datetime(s)
    except Exception:
        try:
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def parse_feed(xml_text: str, default_source: str = "") -> list[dict]:
    """Parse RSS 2.0 or Atom into [{title, link, source, published, summary}]."""
    try:
        root = ET.fromstring(xml_text.encode("utf-8") if isinstance(xml_text, str) else xml_text)
    except ET.ParseError:
        return []
    out: list[dict] = []
    for el in root.iter():
        name = _local(el.tag)
        if name not in ("item", "entry"):
            continue
        d: dict = {"title": "", "link": "", "source": default_source, "published": None, "summary": ""}
        for ch in el:
            n = _local(ch.tag)
            if n == "title":
                d["title"] = _strip_html(ch.text or "")
            elif n == "link":
                d["link"] = (ch.attrib.get("href") or ch.text or "").strip()
            elif n == "source":
                d["source"] = _strip_html(ch.text or "") or d["source"]
            elif n in ("pubDate", "published", "updated", "date") and not d["published"]:
                dt = _parse_date(ch.text)
                d["published"] = dt.isoformat() if dt else None
            elif n in ("description", "summary", "content") and not d["summary"]:
                d["summary"] = _strip_html(ch.text or "")[:400]
        if d["title"] and d["link"]:
            out.append(d)
    return out


def cached(key: str, ttl: float, loader) -> list[dict]:
    now = time.time()
    hit = _CACHE.get(key)
    if hit and now - hit[0] < ttl:
        return hit[1]
    try:
        data = loader()
        if data or not hit:
            _CACHE[key] = (now, data)
            return data
    except Exception as e:
        log.warning("feed %s failed: %s", key, e)
    # stale-on-error: serve the last good copy rather than nothing
    return hit[1] if hit else []


def load_feed(url: str, source: str, ttl: float = 300, headers: dict | None = None) -> list[dict]:
    return cached(url, ttl, lambda: parse_feed(fetch_text(url, headers), source))


def google_news(query: str, when: str = "7d", ttl: float = 600) -> list[dict]:
    q = f"{query} when:{when}" if when else query
    url = f"https://news.google.com/rss/search?q={quote_plus(q)}&hl=en-US&gl=US&ceid=US:en"

    def loader():
        items = parse_feed(fetch_text(url), "Google News")
        for it in items:  # Google appends " - Publisher" to titles
            m = re.search(r"\s+-\s+([^-]{2,40})$", it["title"])
            if m:
                if it["source"] in ("", "Google News"):
                    it["source"] = m.group(1).strip()
        return items
    return cached(url, ttl, loader)


def yahoo_ticker_news(ticker: str, ttl: float = 300) -> list[dict]:
    url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={quote_plus(ticker)}&region=US&lang=en-US"
    return load_feed(url, "Yahoo Finance", ttl)


MARKET_FEEDS = [
    ("https://finance.yahoo.com/news/rssindex", "Yahoo Finance"),
    ("https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", "CNBC"),
    ("https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", "CNBC"),
    ("https://feeds.content.dowjones.io/public/rss/mw_topstories", "MarketWatch"),
    ("https://feeds.content.dowjones.io/public/rss/mw_marketpulse", "MarketWatch"),
]

SEC_FORMS = {
    "SC TO-T": "Third-party tender offer",
    "SC 14D9": "Target response to tender offer",
    "DEFM14A": "Definitive merger proxy",
    "425": "Business-combination communication",
}


def sec_filings(form: str, count: int = 40, ttl: float = 300) -> list[dict]:
    url = ("https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type="
           f"{quote_plus(form)}&company=&dateb=&owner=include&start=0&count={count}&output=atom")

    def loader():
        items = parse_feed(fetch_text(url, {"User-Agent": SEC_UA}), "SEC EDGAR")
        for it in items:
            it["form"] = form
            # EDGAR titles look like "SC TO-T - Company Name (0001234567) (Subject)"
            m = re.match(rf"^{re.escape(form)}\s*-\s*(.+?)\s*\((\d{{6,10}})\)\s*\((.+?)\)", it["title"])
            if m:
                it["company"], it["cik"], it["role"] = m.group(1).strip(), m.group(2), m.group(3)
        return items
    return cached(url, ttl, loader)


def fetch_many(jobs: list) -> list[list[dict]]:
    """Run feed loaders concurrently; one failing feed never breaks the rest."""
    def safe(fn):
        try:
            return fn()
        except Exception as e:  # pragma: no cover - cached() already swallows most
            log.warning("feed job failed: %s", e)
            return []
    with ThreadPoolExecutor(max_workers=8) as ex:
        return list(ex.map(safe, jobs))
