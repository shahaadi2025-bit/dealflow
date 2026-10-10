"""Append newly detected deals to data/deals_history.json (run by a GitHub Action every few hours)."""
import sys
from app.news import history, service


def main() -> int:
    data = service.live_deals(None, days=3, limit=150)
    if not data["items"]:
        print("no deals fetched; history untouched")
        return 0
    old = history.load()
    new = history.merge(old, data["items"])
    history.save(new)
    print(f"history: {len(old)} -> {len(new)} deals")
    return 0


if __name__ == "__main__":
    sys.exit(main())
