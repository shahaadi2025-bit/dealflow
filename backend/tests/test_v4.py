from fastapi.testclient import TestClient
from app.main import app
from app.data.models import Financials
from app.news import history, gdelt
from app.valuation.lbo import lbo
from app.valuation.buyers import _fit

c = TestClient(app)


def F(t, mc, cash=0.0, fcf=0.0, g=0.1, debt=0.0):
    return Financials(ticker=t, name=t, price=10, market_cap=mc, shares=mc / 10, revenue=mc / 5, rev_growth=g,
                      ebitda=mc / 20, fcf=fcf, cash=cash, debt=debt)


def test_lbo_basic():
    r = lbo(100, 500, 1000, leverage=5, growth=0.1)
    assert r["feasible"] and r["moic"] > 0 and len(r["schedule"]) == 5
    cheap = lbo(100, 500, 600, leverage=5, growth=0.1)
    assert cheap["irr"] > r["irr"]
    assert r["max_ev_for_20pct_irr"] is None or r["max_ev_for_20pct_irr"] > 0
    assert not lbo(-5, 10, 100)["feasible"]


def test_buyers_fit_logic():
    t = F("T", 5e9)
    rich = _fit(F("B", 40e9, cash=8e9, fcf=3e9), t, True)
    poor = _fit(F("P", 6e9, cash=1e7), t, True)
    huge_target = _fit(F("S", 1e9), t, True)
    assert rich and rich["score"] > 50
    assert poor is None
    assert huge_target is None  # target bigger than buyer


def test_history_merge_and_league(tmp_path):
    item = {"title": "A to acquire B for $2 billion", "link": "http://x", "source": "S", "published": "2026-10-01T00:00:00+00:00",
            "deal": {"status": "announced", "type": "acquisition", "value_musd": 2000, "acquirer": "A", "target": "B"},
            "tickers": [], "sectors": ["saas"]}
    recs = history.merge([], [item])
    again = history.merge(recs, [dict(item, deal={**item["deal"], "status": "completed"})])
    assert len(again) == 1 and again[0]["status"] == "completed"
    assert history.league(again)[0]["name"] == "A"
    p = tmp_path / "h.json"
    history.save(again, p)
    assert history.load(p)[0]["id"] == again[0]["id"]
    assert history.load(tmp_path / "missing.json") == []
    assert history.summary(again)["disclosed_value_musd"] == 2000


def test_gdelt_parse():
    txt = '{"articles":[{"title":"X agrees to buy Y","url":"http://a","domain":"a.com","seendate":"20261010T121500Z"},{"title":"","url":"u"}]}'
    r = gdelt.parse_gdelt(txt)
    assert len(r) == 1 and r[0]["source"] == "a.com" and r[0]["published"].startswith("2026-10-10")
    assert gdelt.parse_gdelt("garbage") == []


def test_endpoints():
    assert c.get("/health/data").status_code == 200
    assert c.get("/deals/history").status_code == 200
    assert c.get("/deals/league?by=target").status_code == 200
    assert c.get("/deals/league?by=bad").status_code == 422


def test_digest_skips_without_config(monkeypatch):
    from app.scripts import email_digest as d
    for k in ("SMTP_HOST", "SMTP_USER", "SMTP_PASS", "DIGEST_TO"):
        monkeypatch.delenv(k, raising=False)
    assert d.main() == 0
    assert d.build([]) == ""
    assert "http://x" in d.build([{"title": "t", "link": "http://x", "status": "announced"}])


def test_breaker_skips_live_when_cooling(monkeypatch):
    import time
    from app.data import fetch as F
    snap = F.Financials(ticker="ZZZ", name="Z", price=1.0, market_cap=10.0, shares=10.0)
    monkeypatch.setattr(F, "load_snapshot", lambda: {"ZZZ": snap})
    F._CACHE.pop("ZZZ", None)
    F._BREAKER.update(fails=5, until=time.time() + 60)
    called = []
    monkeypatch.setattr(F, "fetch_live", lambda t: called.append(t))
    assert F.get_financials("ZZZ") is snap and not called
    F._BREAKER.update(fails=0, until=0.0)
    F._CACHE.pop("ZZZ", None)
