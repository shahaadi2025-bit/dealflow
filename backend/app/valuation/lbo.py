"""Simple LBO sanity check: can a financial sponsor earn its target return at a given price?"""
from __future__ import annotations


def lbo(ebitda: float, revenue: float, ev_entry: float, *, leverage: float = 5.0, growth: float = 0.08,
        margin_expansion: float = 0.0, exit_multiple: float | None = None, years: int = 5,
        interest: float = 0.09, tax: float = 0.21, fcf_conv: float = 0.5, fees_pct: float = 0.02) -> dict:
    """Entry EV funded by debt (leverage x EBITDA) and sponsor equity. FCF (conv of EBITDA after
    interest and tax shield effects) repays debt. Returns IRR / MOIC and the max price for a 20% IRR."""
    if ebitda <= 0 or ev_entry <= 0:
        return {"feasible": False, "reason": "EBITDA must be positive for an LBO analysis"}
    entry_mult = ev_entry / ebitda
    exit_multiple = exit_multiple if exit_multiple is not None else entry_mult
    debt = min(leverage * ebitda, ev_entry * 0.8)
    fees = ev_entry * fees_pct
    equity = ev_entry + fees - debt
    e = ebitda
    d = debt
    rows = []
    for y in range(1, years + 1):
        e = e * (1 + growth) * (1 + margin_expansion / max(years, 1))
        int_exp = d * interest
        pre_tax = e * fcf_conv * 1.0 - int_exp * (1 - tax)
        pay = max(0.0, min(d, pre_tax))
        d -= pay
        rows.append({"year": y, "ebitda": e, "debt": d, "interest": int_exp})
    exit_ev = e * exit_multiple
    exit_eq = exit_ev - d
    moic = exit_eq / equity if equity > 0 else 0.0
    irr = (moic ** (1 / years) - 1) if moic > 0 else -1.0

    lo, hi = ev_entry * 0.3, ev_entry * 2.0
    best = None
    for _ in range(40):
        mid = (lo + hi) / 2
        r = _quick_irr(ebitda, mid, leverage, growth, margin_expansion, exit_multiple, years, interest, tax, fcf_conv, fees_pct)
        if r >= 0.20:
            lo, best = mid, mid
        else:
            hi = mid
    return {"feasible": True, "entry_multiple": entry_mult, "exit_multiple": exit_multiple, "debt": debt, "equity": equity,
            "exit_ev": exit_ev, "exit_equity": exit_eq, "moic": moic, "irr": irr, "schedule": rows,
            "max_ev_for_20pct_irr": best, "meets_20pct": irr >= 0.20}


def _quick_irr(ebitda, ev, leverage, growth, margin_exp, exit_mult, years, interest, tax, conv, fees_pct):
    debt = min(leverage * ebitda, ev * 0.8)
    equity = ev * (1 + fees_pct) - debt
    e, d = ebitda, debt
    for _ in range(years):
        e = e * (1 + growth) * (1 + margin_exp / max(years, 1))
        pay = max(0.0, min(d, e * conv - d * interest * (1 - tax)))
        d -= pay
    eq = e * exit_mult - d
    return (eq / equity) ** (1 / years) - 1 if equity > 0 and eq > 0 else -1.0
