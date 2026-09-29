# DealFlow — Frontend (Next.js)

## Run locally
```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your backend
npm run dev
```
Open http://localhost:3000 — make sure the backend (see ../backend/README.md) is running first.

## Deploy to Vercel (free)
1. Push this repo to GitHub.
2. vercel.com → New Project → import repo → Root Directory: `frontend`.
3. Framework preset: Next.js (auto-detected).
4. Env var: `NEXT_PUBLIC_API_URL` = your deployed Render backend URL (e.g. `https://dealflow-api.onrender.com`).
5. Deploy. You get `https://your-project.vercel.app`.
