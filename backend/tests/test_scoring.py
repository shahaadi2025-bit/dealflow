from app.screening.scoring import fit_score

def test_fit_score_range():
    feat = {"growth": 0.20, "gross_margin": 0.75, "fcf_margin": 0.20, "rule_of_40": 0.40,
            "ev_rev": 6.0, "cash_ratio": 0.10, "log_mcap": 9.7}
    score, parts = fit_score(feat)
    assert 0 <= score <= 100
    assert len(parts) == 6
