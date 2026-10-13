# DealFlow - AI-powered M&A deal screener and valuation platform

Free, open M&A research workbench: screen acquisition targets across **29 sectors**, follow a **live deal wire**,
value companies (DCF, comps, LBO), see **who could buy them**, and draft an investment memo whose prose is checked
against the computed numbers. Runs entirely on free tiers.

Live: https://dealflow-rho.vercel.app (frontend) - https://dealflow-d366.onrender.com (API)

```
backend/    FastAPI - data fetch, scoring, DCF, comps, LBO, buyers, news, deal archive, memo
frontend/   Next.js 14 (App Router, TypeScript, Tailwind) - installable PWA, black and gold theme
.github/    CI, scheduled snapshot refresh, scheduled deal collector
```

## Features

| Area | What you get |
|---|---|
| Screener | 29 sectors, filters, fit score with drivers, valuation map (growth vs EV/Revenue), CSV export |
| Sector pages | `/sector/[key]`: median metrics, top targets, recent deals, news, precedents |
| Company page | Football field, DCF and comps with adjustable assumptions, price chart, similar companies, likely buyers, LBO check, peer scatter, insider and activist filings, precedent transactions, notes |
| Deal wire | Live M&A headlines (RSS and GDELT fallback) with status, value, parties; SEC deal filings; archive and league table; precedents; 13D activist feed |
| Deal pages | `/deals/[id]`: parties, reported value, implied EV/Revenue and premium to market cap, related coverage |
| News | Market and per-company news with sentiment and ticker/sector tagging |
| Alerts | Deal rules (ticker, sector, size, keyword) and watchlist rules (fit score or price crosses a level); in-app toasts and optional browser notifications |
| Merger model | Pick a likely buyer, set premium, cash/stock mix and synergies; see FCF-per-share accretion, new debt, pro-forma leverage |
| Takeover score | 0-100 heuristic (cheap vs sector, off highs, growth, size, debt) with the reasons |
| Ask DealFlow | `/ask`: chat answers grounded in snapshot, sector medians and the deal archive (Groq, free) |
| Pipeline | Local deal pipeline with stages, import/export, upcoming earnings for your names |
| Memos | AI memo (Groq) with number check, PDF export, shareable link (data lives in the URL fragment) |
| Market | Index tape, top movers, earnings calendar |
| Status | `/status` probes every upstream feed from the server |
| PWA | Installable, offline shell, share cards (static OG image) |

## Data sources and resilience

Yahoo Finance (`yfinance`) live -> 6 hour cache -> committed `backend/data/snapshot.json`.
A circuit breaker drops to snapshot-only after repeated live failures, so the app never hangs.
News: Yahoo, CNBC, MarketWatch, Google News and SEC EDGAR feeds, with GDELT as fallback.
Deal archive: `backend/data/deals_history.json`, appended by a scheduled GitHub Action.
Sector statistics are computed from the snapshot only (fast and offline-safe).
Everything outside SEC and market data is estimated; verify at the primary source. Not investment advice.

## Scheduled jobs (GitHub Actions)

- `refresh-snapshot.yml` - rebuilds `snapshot.json` (aborts safely on upstream outage, merges, atomic write)
- `collect-deals.yml` - every 4 hours adds new deals to the archive; sends an email digest if `SMTP_*` and `DIGEST_TO` secrets exist
- `ci.yml` - backend tests, frontend type-check, lint and build

## Run locally

```powershell
cd backend
python -m venv venv311; .\venv311\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload          # http://localhost:8000/docs
python -m pytest tests -q

cd ..\frontend
npm install
npm run dev                                      # http://localhost:3000
npm run build
```

Frontend env: `NEXT_PUBLIC_API_URL` (API base), optional `NEXT_PUBLIC_SITE_URL`.
Backend env: `GROQ_API_KEY` (memos), optional `STRIPE_*`, `ALLOWED_ORIGINS`.
Never commit keys; set them in Render / Vercel / GitHub secrets.

## API overview

`/screen`, `/screen/custom`, `/sectors`, `/sectors/stats`, `/company/{t}` (+ `/prices`, `/similar`, `/buyers`, `/precedents`, `/filings`),
`/valuate/{t}` (+ `/lbo`, `/merger`, `/report`), `/company/{t}/takeover`, `/memo`, `/memo/pdf`, `/news/*`, `/deals/live`, `/deals/filings`, `/deals/history`, `/deals/league`,
`/deals/precedents`, `/deals/item/{id}`, `/signals/activist`, `/earnings`, `/ask`, `/market/tape`, `/market/movers`, `/health/data`, `/health/feeds`.
Interactive docs at `/docs`.

## Docs

`backend/README.md`, `frontend/README.md`, `DEPLOY.md` (free deployment: Render + Vercel + UptimeRobot).

## Alerts when the site is closed (Telegram, free)

1. In Telegram talk to `@BotFather`, send `/newbot`, copy the token. Send any message to your new bot, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `chat.id`.
2. In GitHub: Settings -> Secrets and variables -> Actions, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
3. Edit `backend/data/watch.json` (tickers, sectors, `min_value_musd`, `keyword`). The "Collect deals" job runs every 4 hours and messages you new matching deals.
