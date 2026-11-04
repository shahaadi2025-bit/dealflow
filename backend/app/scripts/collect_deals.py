"""Append newly detected deals to data/deals_history.json (run by a GitHub Action every few hours)."""
import sys
from app.news import history, service
from app.rag import store


def archive_news() -> None:
    """Keep a rolling 90-day archive of headlines: the corpus Ask DealFlow retrieves from."""
    try:
        items = service.market_news(limit=200)["items"]
    except Exception as e:
        print("news archive skipped:", e)
        return
    if not items:
        print("no news fetched; archive untouched")
        return
    old = store._read(store.NEWS_PATH)
    new = store.merge_news(old, items)
    store.save_news(new)
    print(f"news archive: {len(old)} -> {len(new)}")


def main() -> int:
    archive_news()
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
