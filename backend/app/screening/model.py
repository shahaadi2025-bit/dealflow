"""Optional XGBoost path. Train with: python -m app.screening.model data/labeled_features.csv
CSV columns: ticker, label (1 = acquired, 0 = not), plus FEATURE_KEYS computed POINT-IN-TIME
(before the deal announcement), e.g. from SEC EDGAR filings. Needs requirements-ml.txt.

load() and predict() are deliberately fail-soft: if the ML dependencies aren't installed,
the model file is missing, or the bundle fails to unpickle for any reason, these return
None / fall back rather than raising -- so a missing xgboost install degrades the screener
to the rule-based score instead of crashing the endpoint for every sector."""
import logging
import sys
from pathlib import Path
from app.screening.features import FEATURE_KEYS

log = logging.getLogger("ml_model")
MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "target_model.joblib"


def load():
    if not MODEL_PATH.exists():
        return None
    try:
        import joblib
        return joblib.load(MODEL_PATH)
    except Exception as e:
        log.warning("ML model present but failed to load (%s) -- falling back to rule-based scoring.", e)
        return None


def predict(bundle, feat: dict):
    try:
        import numpy as np
        x = np.array([[feat[k] for k in FEATURE_KEYS]])
        proba = float(bundle["model"].predict_proba(x)[0, 1]) * 100
    except Exception as e:
        log.warning("ML prediction failed (%s) -- caller should fall back to rule-based scoring.", e)
        raise

    drivers = []
    try:
        import shap
        sv = shap.TreeExplainer(bundle["model"]).shap_values(x)[0]
        order = np.argsort(-np.abs(sv))[:3]
        drivers = [{"label": FEATURE_KEYS[i], "points": float(sv[i]), "value": feat[FEATURE_KEYS[i]]} for i in order]
    except Exception:
        pass  # SHAP explanations are a nice-to-have; score itself still stands without them
    return proba, drivers


def train(csv_path: str):
    import joblib, pandas as pd
    from sklearn.model_selection import cross_val_score
    from xgboost import XGBClassifier
    df = pd.read_csv(csv_path)
    X, y = df[FEATURE_KEYS], df["label"]
    m = XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.05, subsample=0.8, eval_metric="logloss")
    print("CV AUC:", cross_val_score(m, X, y, cv=5, scoring="roc_auc").mean().round(3))
    m.fit(X, y)
    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump({"model": m}, MODEL_PATH)
    print("saved", MODEL_PATH)


if __name__ == "__main__":
    train(sys.argv[1])