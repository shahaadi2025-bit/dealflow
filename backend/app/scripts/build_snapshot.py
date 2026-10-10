"""Refresh data/snapshot.json:  python -m app.scripts.build_snapshot

Merge-safe and outage-safe: existing entries are kept when a ticker fails, and the run
aborts (exit 1, nothing written) when Yahoo looks blocked, so a bad day never wipes data.
"""
from __future__ import annotations
import json, os, sys, time
from app.data.fetch import SNAPSHOT_PATH, fetch_live, DataError
from app.data.universe import UNIVERSES, REFERENCE_TICKERS

PERMANENT_MARKERS = ("No market data",)


class SnapshotAborted(Exception):
    pass


def is_permanent(err: Exception) -> bool:
    return any(m in str(err) for m in PERMANENT_MARKERS)


def refresh(existing: dict, tickers, fetch=None, sleep=time.sleep, max_consecutive_transient: int = 15,
            max_transient_ratio: float = 0.25, retry_pause: float = 20.0, log=print) -> dict:
    """Return merged snapshot. Raises SnapshotAborted if the source appears down."""
    fetch = fetch or (lambda t: fetch_live(t).to_dict())
    out = dict(existing)
    tickers = list(tickers)
    run = transient = 0
    for i, t in enumerate(tickers, 1):
        try:
            out[t] = fetch(t)
            run = 0
            log(f"ok   {t}")
        except Exception as e:
            if is_permanent(e):
                log(f"skip {t} (no data)")
                continue
            transient += 1
            run += 1
            log(f"fail {t}: {e}")
            if run >= max_consecutive_transient:
                raise SnapshotAborted(f"{run} consecutive transient failures; source looks blocked")
            if run and run % 5 == 0:
                sleep(retry_pause)
        if i >= 40 and transient / i > max_transient_ratio:
            raise SnapshotAborted(f"transient failure ratio {transient}/{i} too high")
    return out


def main() -> int:
    existing = {}
    if SNAPSHOT_PATH.exists():
        try:
            existing = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8-sig"))
        except Exception:
            existing = {}
    tickers = sorted({t for ts in UNIVERSES.values() for t in ts} | set(REFERENCE_TICKERS))
    try:
        merged = refresh(existing, tickers)
    except SnapshotAborted as e:
        print(f"ABORTED, snapshot untouched: {e}")
        return 1
    for v in merged.values():  # price history is fetched lazily by the API; keep file small
        v.pop("price_history", None)
    tmp = SNAPSHOT_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(merged, separators=(",", ":")), encoding="utf-8")
    os.replace(tmp, SNAPSHOT_PATH)
    print(f"wrote {len(merged)} companies -> {SNAPSHOT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
