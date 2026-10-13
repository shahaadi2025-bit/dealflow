from fastapi.testclient import TestClient
from app.main import app
from app.data import fetch as F
from app.data.models import Financials
from app.valuation.merger import merge
from app.valuation.takeover import takeover_score

c = TestClient(app)
B = Financials("BUY", "Buyer", 100, 100e9, 1e9, revenue=50e9, ebitda=20e9, fcf=10e9, debt=10e9, cash=30e9)
T = Financials("TGT", "Target", 20, 5e9, 250e6, revenue=2e9, ebitda=0.4e9, fcf=0.3e9, debt=1e9, cash=0.5e9, rev_growth=0.2, hi52=30)


def test_merge_math():
    r = merge(B, T, premium=0.2, stock_pct=1.0, synergies_pct_rev=0)
    assert r["feasible"] and r["new_debt"] == 0 and abs(r["offer_equity"] - 6e9) < 1
    assert abs(r["new_shares"] - 60e6) < 1
    assert abs(r["pf_fcf_per_share"] - (10.3e9 / 1.06e9)) < 1e-6
    assert r["accretion"] < 0 and r["breakeven_synergies"] > 0


def test_cash_deal_uses_cash_then_debt():
    r = merge(B, T, premium=0.0, stock_pct=0.0)
    assert r["cash_used"] == 5e9 and r["new_debt"] == 0 and r["new_shares"] == 0


def test_merge_missing_data():
    assert merge(B, Financials("X", "x", 1, 1, 1, fcf=None))["feasible"] is False


def test_takeover_score_bounds():
    s = takeover_score(T)
    assert 0 <= s["score"] <= 100 and s["factors"]


def test_endpoints(monkeypatch):
    monkeypatch.setattr(F, "load_snapshot", lambda: {"BUY": B, "TGT": T})
    monkeypatch.setattr(F, "fetch_live", lambda t: (_ for _ in ()).throw(F.DataError("offline")))
    r = c.post("/valuate/TGT/merger", json={"buyer": "buy"})
    assert r.status_code == 200 and r.json()["feasible"]
    assert c.post("/valuate/TGT/merger", json={"buyer": "NOPE"}).status_code == 404
    assert c.get("/company/TGT/takeover").status_code == 200
