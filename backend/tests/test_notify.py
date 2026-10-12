from app.scripts import notify

R = [{"id": "a", "title": "X take-private", "value_musd": 50, "tickers": ["X"], "sectors": ["saas"], "link": "l"},
     {"id": "b", "title": "Big deal", "value_musd": 5000, "tickers": [], "sectors": [], "link": "l"}]

def test_matching():
    assert notify.matches({"min_value_musd": 1000}, R[1]) and not notify.matches({"min_value_musd": 1000}, R[0])
    assert notify.matches({"tickers": ["x"]}, R[0])
    assert not notify.matches({}, R[0])

def test_select_skips_sent():
    out = notify.select(R, [{"keyword": "take-private"}, {"min_value_musd": 1000}], {"b"})
    assert [r["id"] for r in out] == ["a"]
