from app.data.fetch import DataError, get_financials, get_many
from app.data.universe import UNIVERSES, sector_of
from app.valuation.comps import comps_analysis
from app.valuation.dcf import dcf_from_fcfs, project_fcfs, wacc as calc_wacc

RF, ERP, COST_DEBT, TAX = 0.043, 0.05, 0.06, 0.21
LABELS = {"ev_rev": "Comps: EV / Revenue", "ev_gp": "Comps: EV / Gross profit", "ev_ebitda": "Comps: EV / EBITDA"}


def _clip(x, lo, hi):
    return max(lo, min(hi, x))


def build_assumptions(f, o: dict) -> dict:
    o = {k: v for k, v in (o or {}).items() if v is not None}
    g0 = o.get("growth_start", _clip(f.rev_growth if f.rev_growth is not None else 0.10, 0.03, 0.40))
    g1 = o.get("growth_end", 0.08)
    n = 5
    path = [round(g0 + (g1 - g0) * i / (n - 1), 4) for i in range(n)]
    m0 = _clip(f.fcf_margin if f.fcf_margin is not None else 0.0, -0.5, 0.5)
    m_t = o.get("fcf_margin_target", max(m0, 0.25))
    beta = _clip(f.beta or 1.2, 0.6, 2.0)
    debt_w = f.debt / (f.debt + f.market_cap) if (f.debt + f.market_cap) else 0.0
    w = o.get("wacc", round(calc_wacc(RF, beta, ERP, COST_DEBT, TAX, debt_w), 4))
    return {"growth_path": path, "growth_start": g0, "growth_end": g1, "fcf_margin_start": m0,
            "fcf_margin_target": m_t, "wacc": w, "terminal_g": o.get("terminal_g", 0.03),
            "premium_low": o.get("premium_low", 0.25), "premium_high": o.get("premium_high", 0.40),
            "beta": beta}


def valuate(ticker: str, overrides: dict | None = None, peers: list[str] | None = None) -> dict:
    f = get_financials(ticker)
    if not f.revenue:
        raise DataError(f"Revenue unavailable for {f.ticker}; cannot run DCF")
    a = build_assumptions(f, overrides)
    if a["wacc"] <= a["terminal_g"] + 0.005:
        raise ValueError("WACC must be at least 0.5 points above terminal growth")
    fcfs = project_fcfs(f.revenue, a["growth_path"], a["fcf_margin_start"], a["fcf_margin_target"])
    base = dcf_from_fcfs(fcfs, a["wacc"], a["terminal_g"], f.net_debt, f.shares)

    waccs = [round(a["wacc"] + d, 4) for d in (-0.02, -0.01, 0, 0.01, 0.02)]
    tgs = [round(a["terminal_g"] + d, 4) for d in (-0.01, -0.005, 0, 0.005, 0.01)]
    grid = [[dcf_from_fcfs(fcfs, w, g, f.net_debt, f.shares)["per_share"] if w > g + 0.005 else None
             for g in tgs] for w in waccs]
    core = [v for row in grid[1:4] for v in row[1:4] if v is not None]

    peer_list = peers or [t for t in UNIVERSES[sector_of(f.ticker)] if t != f.ticker][:12]
    peer_fin = [p for t, p in get_many(peer_list).items() if t != f.ticker]
    comps = comps_analysis(f, peer_fin)

    football = []
    if core:
        football.append({"key": "dcf", "label": "DCF (WACC +-1 pt, growth +-0.5 pt)", "low": min(core), "high": max(core), "kind": "dcf"})
    for k, imp in comps["implied"].items():
        if imp:
            football.append({"key": k, "label": LABELS[k] + " (25th-75th pct)", "low": imp["low"], "high": imp["high"], "kind": "comps"})
    if f.lo52 and f.hi52:
        football.append({"key": "range52", "label": "52-week trading range", "low": f.lo52, "high": f.hi52, "kind": "market"})
    offer = {"low": f.price * (1 + a["premium_low"]), "high": f.price * (1 + a["premium_high"])}
    football.append({"key": "offer", "label": f"Offer range ({a['premium_low']:.0%}-{a['premium_high']:.0%} premium)",
                     "low": offer["low"], "high": offer["high"], "kind": "offer"})

    company_dict = f.to_dict()
    company_dict["sector"] = sector_of(f.ticker)
    return {"company": company_dict, "assumptions": a, "dcf": base,
            "sensitivity": {"waccs": waccs, "tgs": tgs, "grid": grid},
            "comps": comps, "football": football, "offer": offer}