import math
from app.data.models import Financials

FEATURE_KEYS = ["growth", "gross_margin", "fcf_margin", "rule_of_40", "ev_rev", "cash_ratio", "log_mcap"]


def compute_features(f: Financials) -> dict | None:
    if not f.revenue or f.rev_growth is None or f.gross_margin is None:
        return None
    fcfm = f.fcf_margin if f.fcf_margin is not None else 0.0
    return {
        "growth": f.rev_growth, "gross_margin": f.gross_margin, "fcf_margin": fcfm,
        "rule_of_40": f.rev_growth + fcfm, "ev_rev": f.ev / f.revenue,
        "cash_ratio": f.cash / f.market_cap if f.market_cap else 0.0,
        "log_mcap": math.log10(f.market_cap),
    }