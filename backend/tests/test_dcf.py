from app.valuation.dcf import dcf

def test_textbook_dcf():
    # 5 years flat FCF growth, WACC 10%, terminal g 2%
    res = dcf(fcf0=100, growth_path=[0.10]*5, wacc_=0.10, terminal_g=0.02, net_debt=200, shares=100)
    assert res["ev"] > 0
    assert res["per_share"] == round((res["ev"] - 200) / 100, 6) or abs(res["per_share"] - (res["ev"]-200)/100) < 1e-6

def test_wacc_below_terminal_raises():
    import pytest
    from app.valuation.dcf import dcf_from_fcfs
    with pytest.raises(ValueError):
        dcf_from_fcfs([100,110,120], wacc_=0.02, terminal_g=0.03, net_debt=0, shares=10)