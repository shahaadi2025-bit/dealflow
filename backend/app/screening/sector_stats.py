import statistics
from app.data.fetch import get_many
from app.data.universe import UNIVERSES
from app.screening.features import compute_features


def sector_stats(sector: str) -> dict:
    tickers = UNIVERSES.get(sector, [])
    fins = get_many(tickers)
    feats = [compute_features(f) for f in fins.values()]
    feats = [f for f in feats if f]

    def med(key):
        vals = [f[key] for f in feats if f.get(key) is not None]
        return round(statistics.median(vals), 4) if vals else None

    return {
        "sector": sector,
        "company_count": len(feats),
        "median_growth": med("growth"),
        "median_gross_margin": med("gross_margin"),
        "median_fcf_margin": med("fcf_margin"),
        "median_rule_of_40": med("rule_of_40"),
        "median_ev_rev": med("ev_rev"),
    }


def all_sector_stats() -> list[dict]:
    return [sector_stats(s) for s in UNIVERSES.keys()]