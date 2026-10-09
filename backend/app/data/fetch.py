"""Financial data layer: yfinance live -> in-memory TTL cache -> committed snapshot fallback.

Yahoo sometimes blocks cloud IPs. The snapshot (data/snapshot.json, built by
`python -m app.scripts.build_snapshot`) keeps the deployed app working when that happens.
"""
from __future__ import annotations
import json, logging, time
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

from app.config import settings
from app.data.models import Financials

log = logging.getLogger("data")
SNAPSHOT_PATH = Path(__file__).resolve().parents[2] / "data" / "snapshot.json"
_CACHE: dict[str, tuple[float, Financials]] = {}


class DataError(Exception):
    pass


def _num(x):
    try:
        v = float(x)
        return None if v != v else v
    except (TypeError, ValueError):
        return None


def load_snapshot() -> dict[str, Financials]:
    if not SNAPSHOT_PATH.exists():
        return {}
    raw = json.loads(SNAPSHOT_PATH.read_text())
    return {k: Financials.from_dict(v) for k, v in raw.items()}


def fetch_live(ticker: str) -> Financials:
    import yfinance as yf
    t = ticker.upper()
    last = None
    for attempt in range(3):
        try:
            tk = yf.Ticker(t)
            info = tk.info or {}
            price = _num(info.get("currentPrice") or info.get("regularMarketPrice"))
            mcap = _num(info.get("marketCap"))
            if not price or not mcap:
                raise DataError(f"No market data for {t}")
            history = []
            try:
                inc = tk.income_stmt
                if inc is not None and "Total Revenue" in inc.index:
                    for col, v in inc.loc["Total Revenue"].items():
                        if _num(v):
                            history.append({"year": col.year, "revenue": float(v)})
                    history.sort(key=lambda r: r["year"])
            except Exception:
                pass
            price_history = []
            try:
                hist = tk.history(period="6mo", interval="1wk")
                if hist is not None and not hist.empty:
                    for idx, row in hist.iterrows():
                        c = _num(row.get("Close"))
                        if c:
                            price_history.append({"date": idx.strftime("%Y-%m-%d"), "close": round(c, 2)})
            except Exception:
                pass
            return Financials(
                ticker=t, name=info.get("shortName") or t, price=price, market_cap=mcap,
                shares=_num(info.get("sharesOutstanding")) or mcap / price,
                revenue=_num(info.get("totalRevenue")), rev_growth=_num(info.get("revenueGrowth")),
                gross_margin=_num(info.get("grossMargins")), ebitda=_num(info.get("ebitda")),
                fcf=_num(info.get("freeCashflow")), debt=_num(info.get("totalDebt")) or 0.0,
                cash=_num(info.get("totalCash")) or 0.0, beta=_num(info.get("beta")),
                hi52=_num(info.get("fiftyTwoWeekHigh")), lo52=_num(info.get("fiftyTwoWeekLow")),
                history=history, price_history=price_history, as_of=date.today().isoformat(),
            )
        except DataError:
            raise
        except Exception as e:  # network / rate limit
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise DataError(f"Live fetch failed for {t}: {last}")


def get_financials(ticker: str) -> Financials:
    t = ticker.upper().strip()
    hit = _CACHE.get(t)
    if hit and time.time() - hit[0] < settings.cache_ttl:
        return hit[1]
    try:
        f = fetch_live(t)
    except DataError as e:
        snap = load_snapshot().get(t)
        if not snap:
            raise
        log.warning("Using snapshot for %s (%s)", t, e)
        f = snap
    _CACHE[t] = (time.time(), f)
    return f


def get_many(tickers: list[str], workers: int = 6) -> dict[str, Financials]:
    out: dict[str, Financials] = {}

    def one(t):
        try:
            return t, get_financials(t)
        except Exception as e:
            log.info("skip %s: %s", t, e)
            return t, None

    with ThreadPoolExecutor(max_workers=workers) as ex:
        for t, f in ex.map(one, list(dict.fromkeys(tickers))):
            if f:
                out[t] = f
    return out