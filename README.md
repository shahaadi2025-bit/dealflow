# DealFlow — AI-Powered M&A Deal Screener & Valuation Platform

Screens acquisition targets in SaaS, fintech, or EV, runs DCF and comparables
valuation with adjustable assumptions, and drafts an investment memo whose
prose is checked against the computed numbers.

```
backend/    FastAPI — data fetch, screening score, DCF, comps, memo generation
frontend/   Next.js — screener table, valuation workbench, memo viewer
```

See `backend/README.md` and `frontend/README.md` for local setup, and
`DEPLOY.md` in the repo root for the full free deployment walkthrough
(Render + Vercel + Supabase-optional + UptimeRobot).
