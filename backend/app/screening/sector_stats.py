import statistics
from app.data.fetch import get_many, load_snapshot
from app.data.universe import UNIVERSES
from app.screening.features import compute_features


def sector_stats(sector: str) -> dict:
    """Prefer the committed snapshot: fast and avoids a live fetch across an entire
    sector's ticker list on every page load. Only tickers missing from the snapshot
    fall back to a (slower) live fetch."""
    tickers = UNIVERSES.get(sector, [])
    snapshot = load_snapshot()

    feats = []
    missing = []
    for t in tickers:
        f = snapshot.get(t)
        if f is None:
            missing.append(t)
            continue
        feat = compute_features(f)
        if feat:
            feats.append(feat)

    if missing:
        live = get_many(missing)
        for f in live.values():
            feat = compute_features(f)
            if feat:
                feats.append(feat)

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