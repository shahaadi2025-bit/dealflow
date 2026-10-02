"""Builds the full labeled training set for the ML scoring model.

Positive examples (label=1): backend/data/historical_deals.csv, a hand-curated set
of real past acquisitions with pre-deal financials sourced from SEC filings and
press coverage. These companies are delisted and can't be fetched live, so their
features are recorded as static data rather than pulled from yfinance.

Negative examples (label=0): every company in the current sector universes that
is NOT in the historical deals list -- i.e. still independently public today,
fetched live so the features reflect real current data.

Run locally (needs real internet access, not available in a restricted sandbox):
    python -m app.scripts.build_training_data
Writes backend/data/labeled_features.csv, ready for:
    python -m app.screening.model data/labeled_features.csv
"""
import csv
from pathlib import Path

from app.data.fetch import get_many
from app.data.universe import UNIVERSES
from app.screening.features import compute_features, FEATURE_KEYS

ROOT = Path(__file__).resolve().parents[2]
HISTORICAL = ROOT / "data" / "historical_deals.csv"
OUT = ROOT / "data" / "labeled_features.csv"


def load_historical() -> list[dict]:
    rows = []
    with open(HISTORICAL, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            rows.append({
                "ticker": row["ticker"], "label": 1,
                **{k: float(row[k]) for k in FEATURE_KEYS},
            })
    return rows


def build_negatives() -> list[dict]:
    historical_tickers = {r["ticker"] for r in load_historical()}
    all_tickers = set()
    for tickers in UNIVERSES.values():
        all_tickers.update(tickers)
    candidates = [t for t in all_tickers if t not in historical_tickers]

    print(f"Fetching live data for {len(candidates)} candidate negative examples...")
    fins = get_many(candidates)
    rows = []
    for t, f in fins.items():
        feat = compute_features(f)
        if not feat:
            continue
        rows.append({"ticker": t, "label": 0, **{k: feat[k] for k in FEATURE_KEYS}})
    print(f"Got usable features for {len(rows)} negative examples.")
    return rows


def main():
    positives = load_historical()
    negatives = build_negatives()
    all_rows = positives + negatives

    with open(OUT, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["ticker", "label"] + FEATURE_KEYS)
        writer.writeheader()
        for r in all_rows:
            writer.writerow(r)

    print(f"\nWrote {len(all_rows)} total rows ({len(positives)} positive, {len(negatives)} negative) -> {OUT}")
    print("Next: python -m app.screening.model data/labeled_features.csv")


if __name__ == "__main__":
    main()