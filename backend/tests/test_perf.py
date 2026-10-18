import time
from app.data import fetch as F
from app.data.models import Financials

S = Financials("ZZZ", "Snap Co", 10, 1e9, 1e8, revenue=1e8)


def test_fast_returns_snapshot_instantly_and_refreshes_in_background(monkeypatch):
    monkeypatch.setenv("SWR", "1")
    F._CACHE.clear(); F._INFLIGHT.clear()
    monkeypatch.setattr(F, "load_snapshot", lambda: {"ZZZ": S})
    live = Financials("ZZZ", "Live Co", 11, 1e9, 1e8, revenue=1e8)

    def slow(t):
        time.sleep(0.3)
        return live
    monkeypatch.setattr(F, "fetch_live", slow)
    t0 = time.time()
    assert F.get_financials("ZZZ", fast=True).name == "Snap Co"
    assert time.time() - t0 < 0.2
    for _ in range(30):
        time.sleep(0.05)
        if F._CACHE.get("ZZZ") and F._CACHE["ZZZ"][1].name == "Live Co":
            break
    assert F.get_financials("ZZZ", fast=True).name == "Live Co"
    F._CACHE.clear()


def test_non_fast_still_waits_for_live(monkeypatch):
    monkeypatch.setenv("SWR", "1")
    F._CACHE.clear()
    monkeypatch.setattr(F, "load_snapshot", lambda: {"ZZZ": S})
    monkeypatch.setattr(F, "fetch_live", lambda t: Financials("ZZZ", "Live Co", 11, 1e9, 1e8))
    assert F.get_financials("ZZZ").name == "Live Co"
    F._CACHE.clear()


def test_gzip_enabled():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).get("/sectors/meta", headers={"Accept-Encoding": "gzip"})
    assert r.headers.get("content-encoding") == "gzip"
