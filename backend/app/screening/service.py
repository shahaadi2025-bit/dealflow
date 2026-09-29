from app.data.fetch import get_many
from app.data.universe import UNIVERSES
from app.screening import model as ml
from app.screening.features import compute_features
from app.screening.scoring import fit_score


def screen(sector="saas", min_mcap=None, max_mcap=None, min_growth=None, min_fcf_margin=None, limit=25) -> list[dict]:
    fins = get_many(UNIVERSES.get(sector, UNIVERSES["saas"]))
    bundle = ml.load()
    rows = []
    for t, f in fins.items():
        feat = compute_features(f)
        if not feat:
            continue
        if min_mcap and f.market_cap < min_mcap: continue
        if max_mcap and f.market_cap > max_mcap: continue
        if min_growth is not None and feat["growth"] < min_growth: continue
        if min_fcf_margin is not None and feat["fcf_margin"] < min_fcf_margin: continue
        if bundle:
            score, drivers = ml.predict(bundle, feat)
            method = "xgboost"
        else:
            score, parts = fit_score(feat)
            top = sorted(parts, key=lambda p: p["score"], reverse=True)[:3]
            drivers = [{"label": p["label"], "points": p["points"], "value": p["value"]} for p in top]
            method = "strategic-fit"
        rows.append({"ticker": t, "name": f.name, "price": f.price, "market_cap": f.market_cap,
                     "growth": feat["growth"], "gross_margin": feat["gross_margin"], "fcf_margin": feat["fcf_margin"],
                     "rule_of_40": feat["rule_of_40"], "ev_rev": feat["ev_rev"], "score": round(score, 1),
                     "drivers": drivers, "method": method})
    rows.sort(key=lambda r: r["score"], reverse=True)
    return rows[:limit]
