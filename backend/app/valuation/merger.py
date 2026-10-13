"""Simple merger model: pro-forma free-cash-flow per share for the buyer (EPS is not in the data feed,
so FCF/share is the accretion proxy). All money in the same units as Financials (USD)."""
from __future__ import annotations


def merge(buyer, target, *, premium: float = 0.30, stock_pct: float = 0.5, synergies_pct_rev: float = 0.02,
          debt_rate: float = 0.06, cash_yield: float = 0.04, tax: float = 0.21) -> dict:
    if not buyer.price or not buyer.shares or buyer.shares <= 0:
        return {"feasible": False, "reason": "Buyer share data unavailable"}
    if buyer.fcf is None or target.fcf is None:
        return {"feasible": False, "reason": "Free cash flow unavailable for one of the companies"}
    premium = max(0.0, min(premium, 1.0))
    stock_pct = max(0.0, min(stock_pct, 1.0))
    offer_equity = target.market_cap * (1 + premium)
    assumed_debt = max(target.debt, 0.0)
    stock_part = offer_equity * stock_pct
    cash_part = offer_equity - stock_part
    cash_used = min(cash_part, max(buyer.cash, 0.0) * 0.8)  # keep 20% of buyer cash as a buffer
    new_debt = cash_part - cash_used
    new_shares = stock_part / buyer.price
    synergies = (target.revenue or 0.0) * max(0.0, min(synergies_pct_rev, 0.2))
    interest_cost = (new_debt * debt_rate + cash_used * cash_yield) * (1 - tax)
    pf_fcf = buyer.fcf + target.fcf + synergies * (1 - tax) - interest_cost
    pf_shares = buyer.shares + new_shares
    base = buyer.fcf / buyer.shares
    pf = pf_fcf / pf_shares
    accretion = (pf - base) / abs(base) if base else None
    # break-even synergies: extra pre-tax synergies needed for 0% accretion
    gap = base * pf_shares - pf_fcf
    breakeven = max(0.0, gap / (1 - tax)) if gap > 0 else 0.0
    pf_ebitda = (buyer.ebitda or 0) + (target.ebitda or 0) + synergies
    pf_net_debt = buyer.net_debt + target.net_debt + new_debt + cash_used
    return {
        "feasible": True, "offer_equity": offer_equity, "offer_per_share": target.price * (1 + premium),
        "stock_part": stock_part, "cash_part": cash_part, "new_debt": new_debt, "cash_used": cash_used,
        "new_shares": new_shares, "ownership_to_target": new_shares / pf_shares, "assumed_target_debt": assumed_debt,
        "synergies": synergies, "base_fcf_per_share": base, "pf_fcf_per_share": pf, "accretion": accretion,
        "accretive": bool(accretion is not None and accretion >= 0), "breakeven_synergies": breakeven,
        "pf_leverage": (pf_net_debt / pf_ebitda) if pf_ebitda > 0 else None,
        "basis": "FCF per share (EPS not available in the data feed)",
    }
