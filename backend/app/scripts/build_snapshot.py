"""Run locally, then commit data/snapshot.json:  python -m app.scripts.build_snapshot"""
import json
from app.data.fetch import SNAPSHOT_PATH, fetch_live, DataError
from app.data.universe import UNIVERSES

out = {}
for sector, tickers in UNIVERSES.items():
    for t in dict.fromkeys(tickers):
        try:
            out[t] = fetch_live(t).to_dict()
            print("ok  ", t)
        except DataError as e:
            print("skip", t, e)
SNAPSHOT_PATH.write_text(json.dumps(out, indent=1))
print(f"wrote {len(out)} companies -> {SNAPSHOT_PATH}")
