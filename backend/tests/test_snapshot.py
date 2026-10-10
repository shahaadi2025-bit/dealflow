import json
import pytest
from app.scripts.build_snapshot import refresh, SnapshotAborted
from app.data import fetch as F
from app.data.fetch import DataError

nosleep = lambda s: None
quiet = lambda *a: None


def test_merge_keeps_existing_on_failure():
    def f(t):
        if t == "B":
            raise RuntimeError("timeout")
        return {"ticker": t, "v": 2}
    out = refresh({"B": {"ticker": "B", "v": 1}}, ["A", "B"], f, nosleep, log=quiet)
    assert out["A"]["v"] == 2 and out["B"]["v"] == 1


def test_permanent_skip_not_counted():
    def f(t):
        raise DataError("No market data for X")
    out = refresh({}, [f"T{i}" for i in range(60)], f, nosleep, log=quiet)
    assert out == {}


def test_consecutive_failures_abort():
    def f(t):
        raise RuntimeError("429")
    with pytest.raises(SnapshotAborted):
        refresh({}, [f"T{i}" for i in range(30)], f, nosleep, log=quiet)


def test_ratio_abort():
    n = {"i": 0}
    def f(t):
        n["i"] += 1
        if n["i"] % 3 == 0:
            raise RuntimeError("x")
        return {"ticker": t}
    with pytest.raises(SnapshotAborted):
        refresh({}, [f"T{i}" for i in range(100)], f, nosleep, log=quiet)


def test_success_all():
    out = refresh({}, ["A", "B"], lambda t: {"ticker": t}, nosleep, log=quiet)
    assert set(out) == {"A", "B"}


def test_load_snapshot_cached_and_reloads(tmp_path, monkeypatch):
    p = tmp_path / "s.json"
    rec = {"ticker": "A", "name": "A", "price": 1.0, "market_cap": 10.0, "shares": 10.0}
    p.write_text(json.dumps({"A": rec}), encoding="utf-8-sig")
    monkeypatch.setattr(F, "SNAPSHOT_PATH", p)
    F._SNAP.update(key=None, data={})
    a = F.load_snapshot()
    assert F.load_snapshot() is a
    p.write_text(json.dumps({"A": rec, "B": {**rec, "ticker": "B"}}))
    assert set(F.load_snapshot()) == {"A", "B"}


def test_corrupt_snapshot_is_empty(tmp_path, monkeypatch):
    p = tmp_path / "s.json"
    p.write_text("{not json")
    monkeypatch.setattr(F, "SNAPSHOT_PATH", p)
    F._SNAP.update(key=None, data={})
    assert F.load_snapshot() == {}


def test_missing_snapshot(tmp_path, monkeypatch):
    monkeypatch.setattr(F, "SNAPSHOT_PATH", tmp_path / "none.json")
    assert F.load_snapshot() == {}
