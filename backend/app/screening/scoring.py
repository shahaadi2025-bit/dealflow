"""Explainable strategic-fit score (default). Each criterion maps to 0..1; score = weighted sum * 100.
Swap in the XGBoost model (app/screening/model.py) once you have labeled data."""
import math

# key, label, weight, lo, hi, higher_is_better
CRITERIA = [
    ("rule_of_40", "Rule of 40", 0.30, 0.0, 0.60, True),
    ("ev_rev", "Affordable EV/Revenue", 0.20, 2.0, 12.0, False),
    ("growth", "Revenue growth", 0.15, 0.05, 0.30, True),
    ("gross_margin", "Gross margin", 0.15, 0.50, 0.85, True),
    ("cash_ratio", "Cash cushion", 0.10, 0.0, 0.25, True),
]
SIZE_WEIGHT = 0.10  # prefers $1B-$15B: digestible for a strategic or sponsor buyer


def _lin(x, lo, hi, higher=True):
    s = max(0.0, min(1.0, (x - lo) / (hi - lo)))
    return s if higher else 1 - s


def _size_score(log_mcap):
    lo, hi = 9.0, math.log10(15e9)
    if lo <= log_mcap <= hi:
        return 1.0
    dist = lo - log_mcap if log_mcap < lo else log_mcap - hi
    return max(0.0, 1 - dist)


def fit_score(feat: dict) -> tuple[float, list[dict]]:
    parts = []
    for key, label, w, lo, hi, higher in CRITERIA:
        s = _lin(feat[key], lo, hi, higher)
        parts.append({"key": key, "label": label, "score": s, "points": w * s * 100, "value": feat[key]})
    s = _size_score(feat["log_mcap"])
    parts.append({"key": "log_mcap", "label": "Deal size fit", "score": s, "points": SIZE_WEIGHT * s * 100,
                  "value": 10 ** feat["log_mcap"]})
    return sum(p["points"] for p in parts), parts
