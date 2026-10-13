"""Heuristic takeover-attractiveness score (0-100) from snapshot data. Not a prediction of an actual bid."""
from __future__ import annotations
from app.data.fetch import load_snapshot
from app.data.universe import UNIVERSES, sector_of


def _pct_rank(x: float, vals: list[float]) -> float:
    return sum(1 for v in vals if v <= x) / len(vals) if vals else 0.5


def takeover_score(f, extra_signals: int = 0) -> dict:
    parts: list[tuple[str, float, str]] = []
    sec = sector_of(f.ticker)
    peers = [p for t in UNIVERSES.get(sec, []) if (p := load_snapshot().get(t)) and p.revenue and p.ev and p.ev > 0]
    if f.revenue and f.ev > 0 and len(peers) >= 5:
        r = 1 - _pct_rank(f.ev / f.revenue, [p.ev / p.revenue for p in peers])
        parts.append(("Cheap vs sector", r, f"EV/Revenue cheaper than {r:.0%} of sector peers"))
    if f.hi52 and f.price and f.hi52 > 0:
        dd = max(0.0, min(1.0, 1 - f.price / f.hi52))
        parts.append(("Off its high", min(dd / 0.5, 1.0), f"{dd:.0%} below 52-week high"))
    if f.rev_growth is not None:
        parts.append(("Growth worth buying", max(0.0, min(1.0, (f.rev_growth + 0.05) / 0.3)), f"revenue growth {f.rev_growth:.0%}"))
    if f.market_cap:
        sweet = 1.0 if 2e9 <= f.market_cap <= 40e9 else 0.6 if f.market_cap < 2e9 else max(0.1, 1 - (f.market_cap - 40e9) / 400e9)
        parts.append(("Digestible size", sweet, "mid-size targets are the easiest to acquire"))
    if f.ebitda and f.ebitda > 0:
        lev = max(f.net_debt, 0) / f.ebitda
        parts.append(("Manageable debt", max(0.0, 1 - lev / 5), f"net debt {lev:.1f}x EBITDA"))
    if not parts:
        return {"score": None, "factors": []}
    score = sum(p[1] for p in parts) / len(parts) * 100 + min(extra_signals, 3) * 4
    return {"score": round(min(score, 100)), "factors": [{"name": n, "value": round(v, 2), "note": t} for n, v, t in parts]}
