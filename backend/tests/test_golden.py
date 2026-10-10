"""Ground-truth checks: hand-computed numbers the models must keep reproducing."""
import pytest
from app.valuation.dcf import dcf, wacc, project_fcfs, dcf_from_fcfs


def test_wacc_hand_computed():
    # ke = 0.043 + 1.2*0.05 = 0.103 ; 80/20 equity/debt ; kd after tax = 0.06*0.79 = 0.0474
    assert wacc(0.043, 1.2, 0.05, 0.06, 0.21, 0.2) == pytest.approx(0.8 * 0.103 + 0.2 * 0.0474)


def test_dcf_flat_perpetuity():
    # zero growth, FCF 100, WACC 10%, g 0 over 1 year: EV = 100/1.1 + (100/0.1)/1.1 = 1000
    r = dcf_from_fcfs([100.0], 0.10, 0.0, 0.0, 10.0)
    assert r["ev"] == pytest.approx(1000.0)
    assert r["per_share"] == pytest.approx(100.0)


def test_net_debt_flows_to_equity():
    r = dcf_from_fcfs([100.0], 0.10, 0.0, 200.0, 10.0)
    assert r["equity"] == pytest.approx(800.0)


def test_project_fcfs_margin_path():
    f = project_fcfs(1000.0, [0.1, 0.1], 0.1, 0.3)
    assert f[0] == pytest.approx(1100 * 0.2) and f[1] == pytest.approx(1210 * 0.3)


def test_wacc_must_exceed_growth():
    with pytest.raises(ValueError):
        dcf(100, [0.1], 0.03, 0.03, 0, 1)
