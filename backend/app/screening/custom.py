from app.data.fetch import get_many
from app.screening.features import compute_features
from app.screening.scoring import fit_score


def screen_custom(tickers: list[str], limit: int = 25) -> list[dict]:
    tickers = [t.strip().upper() for t in tickers if t.strip()][:limit]
    fins = get_many(tickers)
    rows = []
    for t, f in fins.items():
        feat = compute_features(f)
        if not feat:
            continue
        score, parts = fit_score(feat)
        top = sorted(parts, key=lambda p: p["score"], reverse=True)[:3]
        drivers = [{"label": p["label"], "points": p["points"], "value": p["value"]} for p in top]
        rows.append({"ticker": t, "name": f.name, "price": f.price, "market_cap": f.market_cap,
                     "growth": feat["growth"], "gross_margin": feat["gross_margin"], "fcf_margin": feat["fcf_margin"],
                     "rule_of_40": feat["rule_of_40"], "ev_rev": feat["ev_rev"], "score": round(score, 1),
                     "drivers": drivers, "method": "strategic-fit"})
    rows.sort(key=lambda r: r["score"], reverse=True)
    return rows