from datetime import datetime, timezone, timedelta
from app.rag import store, bm25
from app.news import history

NOW = datetime(2026, 11, 4, tzinfo=timezone.utc)
iso = lambda d: (NOW - timedelta(days=d)).isoformat()


def test_tokenize_and_bm25_ranks_relevant_first():
    docs = [bm25.tokenize(t) for t in ["Palo Alto Networks acquires CyberArk for $25 billion", "Fed holds rates steady", "Oil prices fall on supply"]]
    bm = bm25.BM25(docs)
    sc = bm.scores(bm25.tokenize("who is acquiring CyberArk"))
    assert max(sc, key=sc.get) == 0 and 1 not in sc


def test_merge_news_dedupes_and_expires():
    items = [{"title": "A deal", "link": "http://x/1", "published": iso(1)}, {"title": "A deal", "link": "http://x/1", "published": iso(1)},
             {"title": "Old", "link": "http://x/2", "published": iso(200)}, {"title": "no link", "link": ""}]
    out = store.merge_news([], items, NOW)
    assert [r["title"] for r in out] == ["A deal"]


def test_search_with_ticker_boost_and_dedupe(monkeypatch, tmp_path):
    monkeypatch.setattr(history, "load", lambda *a, **k: [
        {"id": "1", "title": "Acme to buy Widget Corp for $2 billion", "link": "l1", "published": iso(2), "tickers": ["WDGT"], "sectors": ["saas"], "acquirer": "Acme", "target": "Widget Corp", "status": "announced", "value_musd": 2000},
        {"id": "2", "title": "Unrelated chip merger talks", "link": "l2", "published": iso(1), "tickers": [], "sectors": ["semis"]}])
    monkeypatch.setattr(store, "NEWS_PATH", tmp_path / "n.json")
    store.save_news([{"id": "z", "title": "Acme to buy Widget Corp for $2 billion", "summary": "dup", "link": "l3", "published": iso(2), "tickers": ["WDGT"], "sectors": []}])
    store._CACHE["key"] = None
    res = store.search("Widget takeover price", k=5, tickers=["WDGT"], now=NOW)
    assert res and res[0]["tickers"] == ["WDGT"]
    assert len([r for r in res if "Widget" in r["title"]]) == 1  # duplicate headline collapsed
    store._CACHE["key"] = None


def test_empty_corpus(monkeypatch, tmp_path):
    monkeypatch.setattr(history, "load", lambda *a, **k: [])
    monkeypatch.setattr(store, "NEWS_PATH", tmp_path / "missing.json")
    store._CACHE["key"] = None
    assert store.search("anything") == []
    store._CACHE["key"] = None
