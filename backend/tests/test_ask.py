import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app import ask
from app.data import fetch as F
from app.data.models import Financials
from app.news import analysis, dealdetail

c = TestClient(app)
T = Financials("CRWD", "CrowdStrike", 400, 100e9, 250e6, revenue=4e9, ebitda=0.5e9, fcf=1e9, debt=1e9, cash=4e9, rev_growth=0.3, hi52=450)


def setup(monkeypatch):
    monkeypatch.setattr(F, "load_snapshot", lambda: {"CRWD": T})
    for m in (ask, dealdetail):
        monkeypatch.setattr(m, "load_snapshot", lambda: {"CRWD": T})
    import app.valuation.takeover as tk
    monkeypatch.setattr(tk, "load_snapshot", lambda: {"CRWD": T})
    analysis._name_index.cache_clear()
    monkeypatch.setattr(ask.history, "load", lambda *a, **k: [])


def test_finds_ticker_and_builds_context(monkeypatch):
    setup(monkeypatch)
    assert ask.find_tickers("Is CRWD a good takeover target?") == ["CRWD"]
    ctx = ask.build_context("Is CRWD a good takeover target?")
    assert ctx["companies"][0]["ticker"] == "CRWD" and ctx["companies"][0]["market_cap"] == 100e9


def test_no_match_message(monkeypatch):
    setup(monkeypatch)
    r = asyncio.run(ask.answer("what is the weather"))
    assert r["ai"] is False and "could not match" in r["answer"]


def test_no_key_returns_facts(monkeypatch):
    setup(monkeypatch)
    monkeypatch.setattr(ask.settings, "groq_api_key", "")
    r = asyncio.run(ask.answer("Tell me about CRWD"))
    assert r["ai"] is False and r["context"]["companies"]


def test_endpoint_validation():
    assert c.post("/ask", json={"question": "hi"}).status_code == 422
    assert c.post("/ask", json={"question": "x" * 500}).status_code == 422
