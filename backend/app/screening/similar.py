"""Nearest-neighbor "similar companies" finder, in the spirit of Grata's similarity
search -- but computed from the same growth/margin/size features we already derive,
with no extra data source or API needed."""
import math
from app.data.fetch import get_many, load_snapshot
from app.data.universe import UNIVERSES, sector_of
from app.screening.features import compute_features, FEATURE_KEYS

# Weight size (log_mcap) a bit less than operating characteristics, since "similar
# business" matters more than "similar size" for this use case.
WEIGHTS = {"growth": 1.0, "gross_margin": 1.0, "fcf_margin": 1.0, "rule_of_40": 0.5,
           "ev_rev": 0.8, "cash_ratio": 0.5, "log_mcap": 0.4}

# Rough normalization ranges so features are comparable on the same scale.
RANGES = {"growth": (0.0, 0.4), "gross_margin": (0.3, 0.95), "fcf_margin": (-0.3, 0.4),
          "rule_of_40": (-0.3, 0.7), "ev_rev": (0.5, 20.0), "cash_ratio": (0.0, 0.5),
          "log_mcap": (8.0, 12.5)}


def _norm(key: str, value: float) -> float:
    lo, hi = RANGES[key]
    return max(0.0, min(1.0, (value - lo) / (hi - lo)))


def _distance(a: dict, b: dict) -> float:
    total = 0.0
    for k in FEATURE_KEYS:
        diff = _norm(k, a[k]) - _norm(k, b[k])
        total += WEIGHTS.get(k, 1.0) * diff * diff
    return math.sqrt(total)


def find_similar(ticker: str, limit: int = 5) -> list[dict]:
    ticker = ticker.upper()
    sector = sector_of(ticker)
    candidates = [t for t in UNIVERSES.get(sector, []) if t != ticker]

    snapshot = load_snapshot()
    target_f = snapshot.get(ticker)
    missing_target = target_f is None
    if missing_target:
        live = get_many([ticker])
        target_f = live.get(ticker)
    if not target_f:
        return []
    target_feat = compute_features(target_f)
    if not target_feat:
        return []

    rows = []
    missing_candidates = []
    for t in candidates:
        f = snapshot.get(t)
        if f is None:
            missing_candidates.append(t)
            continue
        feat = compute_features(f)
        if feat:
            rows.append((t, f, feat))

    if missing_candidates:
        live = get_many(missing_candidates)
        for t, f in live.items():
            feat = compute_features(f)
            if feat:
                rows.append((t, f, feat))

    scored = []
    for t, f, feat in rows:
        d = _distance(target_feat, feat)
        scored.append({"ticker": t, "name": f.name, "distance": round(d, 4),
                        "growth": feat["growth"], "gross_margin": feat["gross_margin"],
                        "ev_rev": feat["ev_rev"]})
    scored.sort(key=lambda r: r["distance"])
    return scored[:limit]