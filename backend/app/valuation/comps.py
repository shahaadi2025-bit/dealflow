import numpy as np
from app.data.models import Financials


def peer_multiples(f: Financials) -> dict:
    ev = f.ev
    return {
        "ticker": f.ticker, "name": f.name, "market_cap": f.market_cap,
        "ev_rev": ev / f.revenue if f.revenue else None,
        "ev_gp": ev / f.gross_profit if f.gross_profit else None,
        "ev_ebitda": ev / f.ebitda if f.ebitda and f.ebitda > 0 else None,
    }


def _exclusion_reason(f: Financials) -> str | None:
    if not f.revenue:
        return "No revenue data available"
    if f.ebitda is None or f.ebitda <= 0:
        if f.gross_profit is None:
            return "No gross profit or positive EBITDA to base a multiple on"
    return None


def _stats(vals):
    v = [x for x in vals if x is not None and x > 0]
    if len(v) < 3:
        return None
    return {"p25": float(np.percentile(v, 25)), "p50": float(np.percentile(v, 50)),
            "p75": float(np.percentile(v, 75)), "n": len(v)}


def comps_analysis(target: Financials, peers: list[Financials]) -> dict:
    rows = [peer_multiples(p) for p in peers]
    stats = {k: _stats([r[k] for r in rows]) for k in ("ev_rev", "ev_gp", "ev_ebitda")}
    metric = {"ev_rev": target.revenue, "ev_gp": target.gross_profit,
              "ev_ebitda": target.ebitda if target.ebitda and target.ebitda > 0 else None}
    implied = {}
    for k, s in stats.items():
        m = metric[k]
        if not s or not m:
            implied[k] = None
            continue
        per = lambda mult: (mult * m - target.net_debt) / target.shares
        implied[k] = {"low": per(s["p25"]), "mid": per(s["p50"]), "high": per(s["p75"])}

    excluded = []
    for p in peers:
        reason = _exclusion_reason(p)
        if reason:
            excluded.append({"ticker": p.ticker, "name": p.name, "reason": reason})

    return {"peers": rows, "stats": stats, "implied": implied, "excluded": excluded}