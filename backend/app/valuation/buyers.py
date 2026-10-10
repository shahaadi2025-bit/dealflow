"""Rank plausible strategic acquirers for a target: affordability, relative size, sector fit, growth."""
from __future__ import annotations
from app.data.fetch import get_many
from app.data.universe import UNIVERSES, sector_of


def _fit(buyer, target, same_sector: bool) -> dict | None:
    if buyer.ticker == target.ticker or not buyer.market_cap:
        return None
    ev_t = target.ev
    firepower = (buyer.cash or 0) + max(buyer.fcf or 0, 0) * 3 + buyer.market_cap * 0.15  # cash + 3y FCF + 15% stock capacity
    afford = min(firepower / ev_t, 2.0) if ev_t > 0 else 0.0
    ratio = ev_t / buyer.market_cap
    if ratio > 1.0 or ratio < 0.01:
        size = 0.0
    else:
        size = 1.0 - abs(ratio - 0.15) / 0.85  # sweet spot: target ~15% of buyer's size
    sector = 1.0 if same_sector else 0.4
    growth = 0.5
    if buyer.rev_growth is not None and target.rev_growth is not None:
        growth = max(0.0, min(1.0, 0.5 + (target.rev_growth - buyer.rev_growth)))  # buyers buy faster growth
    score = 100 * (0.35 * min(afford, 1.0) + 0.25 * max(size, 0) + 0.25 * sector + 0.15 * growth)
    if afford < 0.25 or size <= 0:
        return None
    reasons = []
    if afford >= 1.0:
        reasons.append("can fund the deal from cash, cash flow and stock capacity")
    elif afford >= 0.5:
        reasons.append("needs meaningful stock or debt financing")
    else:
        reasons.append("stretch: would need heavy stock or new debt")
    reasons.append(f"target is ~{ratio:.0%} of its market cap")
    if same_sector:
        reasons.append("same sector (consolidation play)")
    return {"ticker": buyer.ticker, "name": buyer.name, "score": round(score), "market_cap": buyer.market_cap,
            "cash": buyer.cash, "affordability": round(afford, 2), "size_ratio": round(ratio, 3), "reasons": reasons}


def potential_buyers(target, limit: int = 8) -> list[dict]:
    sec = sector_of(target.ticker)
    pool = [t for t in UNIVERSES.get(sec, []) if t != target.ticker][:25]
    adjacent = [t for s, ts in UNIVERSES.items() if s != sec for t in ts[:3]][:30]
    fin = get_many(list(dict.fromkeys(pool + adjacent)))
    out = []
    for t, f in fin.items():
        r = _fit(f, target, t in pool)
        if r:
            out.append(r)
    out.sort(key=lambda r: r["score"], reverse=True)
    return out[:limit]
