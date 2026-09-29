# DealFlow — Backend (FastAPI)

## Run locally
```bash
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # then fill in GROQ_API_KEY
uvicorn app.main:app --reload
```
Docs at http://localhost:8000/docs

## Build the offline snapshot (IMPORTANT before deploying)
Some hosts (including Render's free tier, sometimes) get blocked by Yahoo Finance.
The app auto-falls-back to `data/snapshot.json` when live fetch fails, but you must
build and commit that file once from a machine with normal internet access:
```bash
python -m app.scripts.build_snapshot
git add data/snapshot.json && git commit -m "add data snapshot"
```
Re-run this periodically (e.g. weekly) to keep numbers fresh.

## Optional: train the ML target-scoring model
By default the screener uses an explainable strategic-fit score (no training needed).
To use XGBoost instead:
```bash
pip install -r requirements-ml.txt
python -m app.screening.model data/labeled_features.csv
```
CSV needs columns: ticker, label (1=was acquired, 0=not), plus the feature columns in
`app/screening/features.py::FEATURE_KEYS`, computed point-in-time (before any deal was
announced) to avoid lookahead bias.

## Endpoints
- GET  /health
- GET  /sectors
- GET  /screen?sector=saas&min_mcap=&max_mcap=&min_growth=&min_fcf_margin=&limit=
- GET  /company/{ticker}
- POST /valuate/{ticker}   body: DCF/margin overrides (all optional)
- POST /memo               body: { valuation, screening?, thesis_note? }  (needs GROQ_API_KEY)
- POST /memo/pdf           body: { company_name, memo }

## Deploy to Render (free)
1. Push this repo to GitHub.
2. Render → New → Web Service → connect repo → Root Directory: `backend` → Runtime: Docker.
3. Env vars: CORS_ORIGINS=https://your-frontend.vercel.app, GROQ_API_KEY=..., GROQ_MODEL=llama-3.3-70b-versatile
4. Deploy. Note the URL, e.g. https://dealflow-api.onrender.com
5. Add UptimeRobot monitor hitting /health every 5 min to avoid cold sleep.
