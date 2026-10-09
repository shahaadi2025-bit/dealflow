from app.news import analysis as A, feeds, service

RSS = """<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Acme Corp to acquire Widget Inc for $4.2 billion - Reuters</title><link>http://x/1</link>
<pubDate>Fri, 09 Oct 2026 10:00:00 GMT</pubDate><source url="http://reuters.com">Reuters</source><description>&lt;b&gt;deal&lt;/b&gt;</description></item>
<item><title>Acme Corp to acquire Widget Inc for $4.2 billion - Bloomberg</title><link>http://x/2</link>
<pubDate>Fri, 09 Oct 2026 10:05:00 GMT</pubDate><source url="http://bloomberg.com">Bloomberg</source></item>
<item><title>3 stocks to buy now before earnings</title><link>http://x/3</link><pubDate>Fri, 09 Oct 2026 09:00:00 GMT</pubDate></item>
<item><title>Chipmaker surges after record profit beat</title><link>http://x/4</link><pubDate>Fri, 09 Oct 2026 08:00:00 GMT</pubDate></item>
</channel></rss>"""

ATOM = """<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry>
<title>SC TO-T - Foo Holdings (0001234567) (Subject)</title><link href="http://sec/1"/>
<updated>2026-10-09T12:00:00-04:00</updated><summary>filed</summary></entry></feed>"""


def test_parse_rss_and_atom():
    items = feeds.parse_feed(RSS)
    assert len(items) == 4 and items[0]["source"] == "Reuters" and items[0]["published"].startswith("2026-10-09T10:00")
    assert items[0]["summary"] == "deal"
    a = feeds.parse_feed(ATOM, "SEC")
    assert a[0]["link"] == "http://sec/1" and a[0]["published"].startswith("2026-10-09T16:00")


def test_garbage_xml_is_empty():
    assert feeds.parse_feed("<html not xml") == []


def test_deal_detection_and_value():
    t = "Acme Corp to acquire Widget Inc for $4.2 billion"
    assert A.is_deal(t) and A.deal_value_musd(t) == 4200.0
    assert A.parties(t) == ("Acme Corp", "Widget Inc")
    assert not A.is_deal("3 stocks to buy now before earnings")
    assert not A.is_deal("Company announces $5 billion share buyback")
    assert A.deal_value_musd("Fund raises $750 million") == 750.0


def test_status_and_type():
    assert A.deal_status("Acme in talks to buy Widget") == "rumor"
    assert A.deal_status("Acme completes acquisition of Widget") == "completed"
    assert A.deal_status("Acme calls off Widget merger") == "terminated"
    assert A.deal_status("Acme to acquire Widget") == "announced"
    assert A.deal_type("launches tender offer for Foo") == "Tender offer"
    assert A.deal_type("KKR agrees take-private of Foo") == "Take-private / buyout"


def test_sentiment_and_tags():
    assert A.sentiment("Chipmaker surges after record profit beat")["label"] == "bullish"
    assert A.sentiment("Stock plunges on fraud probe and downgrade")["label"] == "bearish"
    assert A.sentiment("Company holds annual meeting")["label"] == "neutral"
    assert "Earnings" in A.tags_for("Q3 results beat estimates, raises guidance")


def test_ticker_extraction_patterns():
    assert A.tickers_in("Foo Corp (NASDAQ: FOOO) jumps and $BAR rises")[:2] == ["FOOO", "BAR"]


def test_dedupe_collapses_syndicated_story():
    items = feeds.parse_feed(RSS)
    for i in items:
        i["title"] = A.strip_source_suffix(i["title"], i["source"])
    out = service.dedupe(items)
    deal = [i for i in out if "Widget" in i["title"]]
    assert len(deal) == 1 and deal[0]["also_reported_by"] == ["Bloomberg"]


def test_market_news_end_to_end(monkeypatch):
    monkeypatch.setattr(feeds, "fetch_text", lambda url, headers=None, timeout=8.0: RSS)
    feeds._CACHE.clear()
    out = service.market_news(limit=20)
    assert out["count"] >= 2 and out["mood"]["label"] in {"bullish", "bearish", "neutral"}
    deals = service.market_news(limit=20, deals_only=True)["items"]
    assert deals and deals[0]["deal"]["value_musd"] == 4200.0
    feeds._CACHE.clear()


def test_feed_failure_degrades_to_empty(monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("blocked")
    monkeypatch.setattr(feeds, "fetch_text", boom)
    feeds._CACHE.clear()
    assert service.market_news()["items"] == []
    assert service.live_deals()["items"] == []
    assert service.sec_deal_filings()["items"] == []


def test_stale_on_error(monkeypatch):
    feeds._CACHE.clear()
    monkeypatch.setattr(feeds, "fetch_text", lambda *a, **k: RSS)
    assert len(feeds.load_feed("http://same", "S", ttl=0)) == 4
    def boom(*a, **k):
        raise RuntimeError("down")
    monkeypatch.setattr(feeds, "fetch_text", boom)
    assert len(feeds.load_feed("http://same", "S", ttl=0)) == 4  # served from stale cache
    feeds._CACHE.clear()


def test_sec_filings_parse(monkeypatch):
    monkeypatch.setattr(feeds, "fetch_text", lambda *a, **k: ATOM)
    feeds._CACHE.clear()
    r = service.sec_deal_filings()
    assert r["items"] and r["items"][0]["company"] == "Foo Holdings"
    feeds._CACHE.clear()


def test_endpoints_registered():
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    assert c.get("/sectors/meta").json()["sectors"][0]["key"] == "saas"
    assert c.get("/news/market?sector=nope").status_code == 400
    assert c.get("/news/market?sentiment=weird").status_code == 422


def test_more_deal_phrasings():
    assert A.is_deal("Pfizer completes acquisition of Biotech Co for $2.3 billion")
    assert A.parties("Salesforce to acquire data startup Informatica rival for $8.0 billion")[0] == "Salesforce"
    assert A.parties("Exxon in talks to buy Pioneer Natural for $12 billion")[1] == "Pioneer Natural"
    assert not A.is_deal("Why this is the best time to buy the dip")


def test_bare_ticker_needs_known_symbol(monkeypatch):
    A._name_index.cache_clear()
    monkeypatch.setattr(A, "_name_index", lambda: ({}, {"NVDA", "AI", "SEC"}))
    assert A.tickers_in("Chipmaker NVDA surges as SEC probes AI claims") == ["NVDA"]


def test_rate_cuts_are_not_bearish_and_sector_prefers_specific():
    assert A.sentiment("Fed minutes point to slower rate cuts")["label"] == "neutral"
    assert A.sentiment("Company cuts guidance and shares slide")["label"] == "bearish"
    assert A.sector_for_ticker("NVDA") == "semis"
