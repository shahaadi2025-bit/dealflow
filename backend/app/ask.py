"""Ask DealFlow: answer a question using only facts gathered from our own data (snapshot, deal archive)."""
from __future__ import annotations
import json, re
import httpx
from app.config import settings
from app.data.fetch import load_snapshot
from app.data.universe import UNIVERSES, sector_of
from app.news import dealdetail, history
from app.screening.sector_stats import sector_stats
from app.valuation.takeover import takeover_score

SYSTEM = ("You are DealFlow's research assistant for M&A screening. Answer ONLY from the JSON facts provided. "
          "If the facts do not contain the answer, say so plainly and suggest which page of the app to check. "
          "Quote numbers exactly as given, never invent figures, keep it under 180 words, and do not give investment advice.")


def _company_facts(t: str) -> dict | None:
    f = load_snapshot().get(t)
    if not f:
        return None
    ts = takeover_score(f)
    return {"ticker": t, "name": f.name, "sector": sector_of(t), "price": f.price, "market_cap": f.market_cap, "ev": f.ev,
            "revenue": f.revenue, "revenue_growth": f.rev_growth, "gross_margin": f.gross_margin, "ebitda": f.ebitda,
            "fcf": f.fcf, "net_debt": f.net_debt, "takeover_score": ts.get("score"), "as_of": f.as_of}


def find_tickers(q: str, limit: int = 3) -> list[str]:
    snap, found = load_snapshot(), []
    for tok in re.findall(r"\b[A-Z]{1,5}(?:[.-][A-Z])?\b", q):
        if tok in snap and tok not in found and tok not in {"A", "I", "AI", "IT", "M", "AND", "THE", "FOR", "ARE", "ALL"}:
            found.append(tok)
    for chunk in re.findall(r"[A-Z][\w&.-]+(?:\s+[A-Z][\w&.-]+){0,2}", q):
        t = dealdetail.resolve_ticker(chunk)
        if t and t not in found:
            found.append(t)
    return found[:limit]


def find_sector(q: str) -> str | None:
    from app.data.sectors import SECTOR_META
    low = q.lower()
    for key in UNIVERSES:
        if key.replace("_", " ") in low or SECTOR_META.get(key, {}).get("label", "\0").lower() in low:
            return key
    return None


def build_context(q: str) -> dict:
    tickers = find_tickers(q)
    sector = find_sector(q) or (sector_of(tickers[0]) if tickers else None)
    ctx: dict = {"companies": [c for t in tickers if (c := _company_facts(t))]}
    if sector:
        try:
            ctx["sector_medians"] = sector_stats(sector)
        except Exception:
            pass
    recs = history.load()
    rel = [r for r in recs if (not tickers or set(tickers) & set(r.get("tickers") or [])) and (not sector or sector in (r.get("sectors") or []) or tickers)]
    ctx["recent_deals"] = [{"title": r["title"], "status": r.get("status"), "value_musd": r.get("value_musd"), "published": r.get("published")} for r in rel[:8]]
    precs = dealdetail.precedents(recs, sector)
    if precs.get("stats"):
        ctx["precedent_ev_revenue"] = precs["stats"]
    return ctx


async def answer(q: str) -> dict:
    ctx = build_context(q)
    if not ctx["companies"] and not ctx.get("sector_medians") and not ctx["recent_deals"]:
        return {"answer": "I could not match that to a tracked company, sector or deal. Try naming a ticker (for example CRWD) or a sector.", "context": ctx, "ai": False}
    if not settings.groq_api_key:
        return {"answer": "AI answers are not configured on this server (no GROQ_API_KEY). Here are the facts I found.", "context": ctx, "ai": False}
    body = {"model": settings.groq_model, "temperature": 0.1, "max_tokens": 450,
            "messages": [{"role": "system", "content": SYSTEM},
                         {"role": "user", "content": f"Question: {q}\n\nFacts:\n{json.dumps(ctx, default=str)[:9000]}"}]}
    headers = {"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=40) as client:
        r = await client.post("https://api.groq.com/openai/v1/chat/completions", json=body, headers=headers)
        r.raise_for_status()
    return {"answer": r.json()["choices"][0]["message"]["content"].strip(), "context": ctx, "ai": True}
