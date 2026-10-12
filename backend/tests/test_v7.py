from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.data import fetch as F
from app.data.models import Financials
from app.news import dealdetail, signals, feeds, analysis, history

c = TestClient(app)

ATOM = """<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>4 - Smith John (0001111111) (Reporting)</title><link href="http://sec/1"/><updated>2026-10-09T10:00:00-04:00</updated><summary>Form 4 buy</summary></entry>
<entry><title>4 - Doe Jane (0002222222) (Reporting)</title><link href="http://sec/2"/><updated>2026-10-08T10:00:00-04:00</updated></entry></feed>"""


def snap(monkeypatch, **fins):
    monkeypatch.setattr(F, "load_snapshot", lambda: fins)
    monkeypatch.setattr(dealdetail, "load_snapshot", lambda: fins)
    analysis._name_index.cache_clear()


def fin(t, name, mc=5e9, rev=1e9, ebitda=2e8):
    return Financials(ticker=t, name=name, price=10, market_cap=mc, shares=mc / 10, revenue=rev, ebitda=ebitda)


def test_resolve_and_implied(monkeypatch):
    snap(monkeypatch, DAY=fin("DAY", "Dayforce, Inc."), ZZZ=fin("ZZZ", "Zeta Zeta Corp"))
    assert dealdetail.resolve_ticker("Dayforce") == "DAY"
    assert dealdetail.resolve_ticker("Dayforce Inc") == "DAY"
    assert dealdetail.resolve_ticker("Unknown Widgets") is None
    imp = dealdetail.implied({"value_musd": 6000, "target": "Dayforce"})
    assert imp["ticker"] == "DAY" and imp["ev_rev"] == 6.0 and imp["premium_to_market_cap"] == 0.2 and imp["ev_ebitda"] == 30.0
    assert dealdetail.implied({"value_musd": None, "target": "Dayforce"}) is None
    analysis._name_index.cache_clear()


def test_precedents_stats(monkeypatch):
    snap(monkeypatch, DAY=fin("DAY", "Dayforce, Inc."), ABC=fin("ABC", "Abacus Systems Ltd", rev=2e9))
    recs = [
        {"id": "1", "title": "t1", "status": "announced", "value_musd": 6000, "target": "Dayforce", "sectors": ["saas"]},
        {"id": "2", "title": "t2", "status": "completed", "value_musd": 8000, "target": "Abacus Systems", "sectors": ["saas"]},
        {"id": "3", "title": "t3", "status": "rumor", "value_musd": 9000, "target": "Dayforce", "sectors": ["saas"]},
        {"id": "4", "title": "t4", "status": "announced", "value_musd": 100, "target": "Nobody", "sectors": ["saas"]},
    ]
    r = dealdetail.precedents(recs, "saas")
    assert r["stats"]["n"] == 2 and r["stats"]["median"] == 5.0
    assert dealdetail.precedents(recs, "biotech")["stats"] is None
    analysis._name_index.cache_clear()


def test_company_filings_parse(monkeypatch):
    feeds._CACHE.clear()
    monkeypatch.setattr(feeds, "fetch_text", lambda url, headers=None, timeout=8.0: ATOM)
    r = signals.company_filings("NVDA", ["4"])
    assert len(r) == 2 and r[0]["link"] == "http://sec/1" and r[0]["form"] == "4"
    assert signals.classify_form("SCHEDULE 13D/A") == "activist" and signals.classify_form("4") == "insider"
    feeds._CACHE.clear()


def test_earnings_soft_fail(monkeypatch):
    signals._E_CACHE.clear()
    d = date.today() + timedelta(days=5)
    monkeypatch.setattr(signals, "_next_earnings", lambda t: d if t == "AAA" else (_ for _ in ()).throw(RuntimeError("x")))
    r = signals.earnings(["AAA", "BBB"])
    assert r == [{"ticker": "AAA", "date": d.isoformat(), "days": 5}]
    signals._E_CACHE.clear()


def test_movers_offline_is_empty(monkeypatch):
    import sys, types
    mod = types.ModuleType("yfinance")
    mod.download = lambda *a, **k: (_ for _ in ()).throw(RuntimeError("offline"))
    monkeypatch.setitem(sys.modules, "yfinance", mod)
    signals._M.update(t=0.0, data=None)
    assert signals.movers() == {"updated": None, "gainers": [], "losers": []}


def test_endpoints_validation():
    assert c.get("/deals/item/not-valid!").status_code in (400, 404)
    assert c.get("/deals/item/" + "a" * 30).status_code == 400
    assert c.get("/deals/precedents?sector=zzz").status_code == 400
    assert c.get("/deals/precedents").status_code == 200
    assert c.get("/company/NVDA/filings?kind=bad").status_code == 422
    assert c.get("/company/%24%24/filings").status_code in (400, 404)
    assert c.get("/earnings?tickers=").json() == {"items": []}
    assert c.get("/earnings?tickers=%3Cb%3E").status_code == 400


def test_deal_item_from_archive(monkeypatch, tmp_path):
    rec = {"id": "abc123", "title": "A to buy B", "link": "http://x", "source": "S", "published": "2026-10-01T00:00:00+00:00",
           "status": "announced", "type": "acquisition", "value_musd": 500, "acquirer": "A", "target": "B", "tickers": [], "sectors": ["saas"]}
    monkeypatch.setattr(history, "load", lambda path=None: [rec])
    r = c.get("/deals/item/abc123")
    assert r.status_code == 200 and r.json()["deal"]["id"] == "abc123" and r.json()["implied"] is None


def test_feed_health_shape(monkeypatch):
    monkeypatch.setattr(feeds, "fetch_text", lambda url, headers=None, timeout=8.0: (_ for _ in ()).throw(RuntimeError("blocked")))
    r = signals.feed_health()
    assert r["all_ok"] is False and "gdelt" in r["sources"] and all("ok" in v for v in r["sources"].values())


def test_resolve_rejects_short_names(monkeypatch):
    snap(monkeypatch, ES=fin("ES", "Eversource Energy (D/B/A)"))
    assert dealdetail.resolve_ticker("B") is None
    assert dealdetail.resolve_ticker("Acme") is None
    analysis._name_index.cache_clear()
