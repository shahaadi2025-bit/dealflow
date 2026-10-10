import statistics, time
from app.data.fetch import load_snapshot
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

    # Tickers absent from the snapshot are skipped, never fetched live: a sector-wide live fetch can
    # block for minutes when Yahoo throttles, and the nightly snapshot refresh fills them in.

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


_ALL: dict = {"t": 0.0, "key": None, "data": []}


def all_sector_stats() -> list[dict]:
    """Cached for 10 minutes (keyed on the loaded snapshot) since it only reads the snapshot."""
    snap = load_snapshot()
    key = id(snap)
    if _ALL["key"] == key and time.time() - _ALL["t"] < 600:
        return _ALL["data"]
    data = [sector_stats(s) for s in UNIVERSES.keys()]
    _ALL.update(t=time.time(), key=key, data=data)
    return data