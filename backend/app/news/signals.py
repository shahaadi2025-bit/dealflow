"""Free market signals: SEC insider/activist filings, earnings dates, market movers, feed diagnostics."""
from __future__ import annotations
import re, time, logging
from datetime import date, datetime, timezone
from urllib.parse import quote_plus

from app.news import feeds

log = logging.getLogger("signals")

FORM_ALIASES = {
    "insider": ["4"],
    "activist": ["SCHEDULE 13D", "SC 13D", "SCHEDULE 13D/A", "SC 13D/A"],
    "passive": ["SCHEDULE 13G", "SC 13G", "SCHEDULE 13G/A", "SC 13G/A"],
}


def company_filings(ticker: str, forms: list[str], count: int = 25, ttl: float = 900) -> list[dict]:
    """Recent EDGAR filings for one company. EDGAR accepts a ticker in the CIK field."""
    out: list[dict] = []
    seen: set[str] = set()
    for form in forms:
        url = ("https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=" + quote_plus(ticker.upper())
               + f"&type={quote_plus(form)}&dateb=&owner=include&count={count}&output=atom")

        def loader(url=url):
            return feeds.parse_feed(feeds.fetch_text(url, {"User-Agent": feeds.SEC_UA}), "SEC EDGAR")
        for it in feeds.cached(url, ttl, loader):
            if it["link"] in seen:
                continue
            seen.add(it["link"])
            m = re.match(r"^(?P<form>[\w/ ]+?)\s*-\s*(?P<rest>.*)$", it["title"])
            out.append({"form": (m.group("form").strip() if m else form), "title": it["title"], "summary": it.get("summary", ""),
                        "link": it["link"], "published": it.get("published")})
    out.sort(key=lambda x: x["published"] or "", reverse=True)
    return out[:count]


def classify_form(form: str) -> str:
    f = form.upper()
    if f == "4":
        return "insider"
    if "13D" in f:
        return "activist"
    if "13G" in f:
        return "passive"
    return "other"


def activist_feed(limit: int = 40) -> list[dict]:
    jobs = [lambda f=f: feeds.sec_filings(f) for f in ("SCHEDULE 13D", "SC 13D", "SCHEDULE 13D/A", "SC 13D/A")]
    items: list[dict] = []
    for lst in feeds.fetch_many(jobs):
        for it in lst:
            items.append({"form": it.get("form"), "company": it.get("company") or it["title"], "role": it.get("role"),
                          "link": it["link"], "published": it.get("published")})
    items.sort(key=lambda x: x["published"] or "", reverse=True)
    return items[:limit]


# ---------------- earnings dates ----------------
_E_CACHE: dict = {}


def _next_earnings(ticker: str):
    import yfinance as yf
    cal = yf.Ticker(ticker).calendar
    dates = cal.get("Earnings Date") if isinstance(cal, dict) else None
    if not dates:
        return None
    today = date.today()
    future = sorted(d for d in dates if hasattr(d, "year") and d >= today)
    return future[0] if future else None


def earnings(tickers: list[str]) -> list[dict]:
    from concurrent.futures import ThreadPoolExecutor
    now = time.time()

    def one(t):
        hit = _E_CACHE.get(t)
        if hit and now - hit[0] < 6 * 3600:
            return t, hit[1]
        try:
            d = _next_earnings(t)
        except Exception as e:
            log.info("earnings %s failed: %s", t, e)
            return t, hit[1] if hit else None
        _E_CACHE[t] = (now, d.isoformat() if d else None)
        return t, _E_CACHE[t][1]
    with ThreadPoolExecutor(max_workers=6) as ex:
        res = list(ex.map(one, tickers))
    out = [{"ticker": t, "date": d, "days": (date.fromisoformat(d) - date.today()).days} for t, d in res if d]
    out.sort(key=lambda x: x["date"])
    return out


# ---------------- movers ----------------
BASKET = ("AAPL MSFT NVDA GOOGL AMZN META TSLA AVGO ORCL CRM ADBE AMD INTC QCOM NFLX DIS NKE KO PEP WMT COST HD MCD JPM BAC GS MS V MA "
          "PYPL UNH LLY JNJ PFE MRK ABBV XOM CVX COP CAT DE BA LMT GE HON UPS FDX T VZ TMUS SHOP SNOW PLTR UBER ABNB CRWD PANW NOW INTU").split()
_M = {"t": 0.0, "data": None}


def movers(top: int = 6) -> dict:
    now = time.time()
    if _M["data"] is not None and now - _M["t"] < 300:
        return _M["data"]
    try:
        import yfinance as yf
        df = yf.download(BASKET, period="5d", interval="1d", progress=False, auto_adjust=True, group_by="column", threads=True)
        close = df["Close"]
        rows = []
        for t in BASKET:
            s = close[t].dropna() if t in close else None
            if s is not None and len(s) >= 2:
                rows.append({"ticker": t, "price": round(float(s.iloc[-1]), 2), "change_pct": round((float(s.iloc[-1]) / float(s.iloc[-2]) - 1) * 100, 2)})
        rows.sort(key=lambda r: r["change_pct"], reverse=True)
        data = {"updated": datetime.now(timezone.utc).isoformat(), "gainers": rows[:top], "losers": list(reversed(rows[-top:])) if rows else []}
        if rows:
            _M.update(t=now, data=data)
        return data
    except Exception as e:
        log.info("movers failed: %s", e)
        return _M["data"] or {"updated": None, "gainers": [], "losers": []}


# ---------------- diagnostics ----------------
def feed_health() -> dict:
    """Probe each upstream once so the owner can see which sources work from the server's network."""
    from concurrent.futures import ThreadPoolExecutor
    checks = {
        "yahoo_rss": lambda: feeds.parse_feed(feeds.fetch_text(feeds.MARKET_FEEDS[0][0]), "Yahoo"),
        "cnbc_rss": lambda: feeds.parse_feed(feeds.fetch_text(feeds.MARKET_FEEDS[1][0]), "CNBC"),
        "marketwatch_rss": lambda: feeds.parse_feed(feeds.fetch_text(feeds.MARKET_FEEDS[3][0]), "MW"),
        "google_news": lambda: feeds.parse_feed(feeds.fetch_text("https://news.google.com/rss/search?q=acquisition+when:1d&hl=en-US&gl=US&ceid=US:en"), "G"),
        "sec_edgar": lambda: feeds.parse_feed(feeds.fetch_text("https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=425&output=atom&count=5", {"User-Agent": feeds.SEC_UA}), "SEC"),
        "gdelt": lambda: __import__("app.news.gdelt", fromlist=["x"]).parse_gdelt(feeds.fetch_text("https://api.gdeltproject.org/api/v2/doc/doc?query=acquisition&mode=artlist&format=json&maxrecords=5")),
        "yahoo_quotes": lambda: [__import__("yfinance").Ticker("AAPL").fast_info["last_price"]],
    }

    def run(kv):
        k, fn = kv
        t0 = time.time()
        try:
            r = fn()
            return k, {"ok": bool(r), "items": len(r), "ms": int((time.time() - t0) * 1000)}
        except Exception as e:
            return k, {"ok": False, "error": str(e)[:120], "ms": int((time.time() - t0) * 1000)}
    with ThreadPoolExecutor(max_workers=7) as ex:
        res = dict(ex.map(run, checks.items()))
    return {"checked": datetime.now(timezone.utc).isoformat(), "sources": res, "all_ok": all(v["ok"] for v in res.values())}
