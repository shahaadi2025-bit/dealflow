import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request

from app.config import settings
from app.data.fetch import DataError, get_financials
from app.data.universe import UNIVERSES, sector_of
from app.screening.service import screen
from app.screening.custom import screen_custom
from app.valuation.service import valuate
from app.memo.generate import generate_memo
from app.memo.pdf import memo_to_pdf_bytes
from app.memo.report import valuation_to_pdf_bytes
from app.data.lookup import search_tickers
from app.screening.sector_stats import all_sector_stats, sector_stats
from app.screening.similar import find_similar
from app.screening.deals_feed import list_deals
from app.data.sectors import SECTOR_META
from app.news import service as news_service
from app.billing.service import create_checkout_session, verify_session, BillingNotConfigured

logging.basicConfig(level=logging.INFO)
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="DealFlow API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True,
                    allow_methods=["*"], allow_headers=["*"])


@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}


@app.get("/sectors")
def sectors():
    return {"sectors": list(UNIVERSES.keys())}


@app.post("/billing/create-checkout-session")
@limiter.limit("10/minute")
def billing_checkout_endpoint(request: Request):
    try:
        url = create_checkout_session()
        return {"url": url}
    except BillingNotConfigured as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(502, f"Could not start checkout: {e}")


@app.get("/billing/verify-session")
@limiter.limit("20/minute")
def billing_verify_endpoint(request: Request, session_id: str):
    try:
        paid = verify_session(session_id)
        return {"paid": paid}
    except BillingNotConfigured as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(502, f"Could not verify session: {e}")


@app.get("/tickers/search")
def tickers_search_endpoint(q: str = ""):
    return {"results": search_tickers(q)}


@app.get("/sectors/stats")
@limiter.limit("20/minute")
def sectors_stats_endpoint(request: Request):
    return {"sectors": all_sector_stats()}


@app.get("/sectors/stats/{sector}")
@limiter.limit("20/minute")
def sector_stats_endpoint(request: Request, sector: str):
    if sector not in UNIVERSES:
        raise HTTPException(400, f"Unknown sector '{sector}'")
    return sector_stats(sector)


@app.get("/screen")
@limiter.limit("20/minute")
def screen_endpoint(request: Request, sector: str = "saas", min_mcap: float | None = None,
                     max_mcap: float | None = None, min_growth: float | None = None,
                     min_fcf_margin: float | None = None, limit: int = Query(25, le=50)):
    if sector not in UNIVERSES:
        raise HTTPException(400, f"Unknown sector '{sector}'. Choose from {list(UNIVERSES)}")
    return {"sector": sector, "results": screen(sector, min_mcap, max_mcap, min_growth, min_fcf_margin, limit)}


class CustomScreenRequest(BaseModel):
    tickers: list[str]


@app.post("/screen/custom")
@limiter.limit("10/minute")
def screen_custom_endpoint(request: Request, body: CustomScreenRequest):
    if not body.tickers:
        raise HTTPException(400, "Provide at least one ticker")
    if len(body.tickers) > 25:
        raise HTTPException(400, "Limit to 25 tickers per custom screen")
    return {"sector": "custom", "results": screen_custom(body.tickers)}


@app.get("/company/{ticker}/similar")
@limiter.limit("20/minute")
def similar_endpoint(request: Request, ticker: str, limit: int = Query(5, le=10)):
    results = find_similar(ticker, limit)
    if not results:
        raise HTTPException(404, f"No similar-company data available for {ticker.upper()}")
    return {"ticker": ticker.upper(), "results": results}


@app.get("/sectors/meta")
def sectors_meta():
    return {"sectors": [{"key": k, "label": v["label"], "blurb": v["blurb"]} for k, v in SECTOR_META.items()]}


# ---------------- news, live deals, market tape (all free RSS/EDGAR, cached) ----------------
@app.get("/news/market")
@limiter.limit("60/minute")
def news_market(request: Request, limit: int = Query(60, ge=1, le=150), sector: str | None = None,
                sentiment: str | None = Query(None, pattern="^(bullish|bearish|neutral)$"),
                deals_only: bool = False, q: str | None = Query(None, max_length=60)):
    if sector and sector not in UNIVERSES:
        raise HTTPException(400, f"Unknown sector '{sector}'")
    return news_service.market_news(limit, sector, sentiment, deals_only, q)


@app.get("/news/trending")
@limiter.limit("30/minute")
def news_trending(request: Request):
    return news_service.trending_tickers()


@app.get("/news/ticker/{ticker}")
@limiter.limit("40/minute")
def news_ticker(request: Request, ticker: str, limit: int = Query(25, ge=1, le=60)):
    t = ticker.upper()
    if not t.replace("-", "").replace(".", "").replace("=", "").replace("^", "").isalnum() or len(t) > 12:
        raise HTTPException(400, "Invalid ticker")
    name = None
    try:
        name = get_financials(t).name
    except Exception:
        pass
    return news_service.ticker_news(t, name, limit)


@app.get("/deals/live")
@limiter.limit("30/minute")
def deals_live(request: Request, sector: str | None = None, days: int = Query(7, ge=1, le=30),
               limit: int = Query(80, ge=1, le=150)):
    if sector and sector not in UNIVERSES:
        raise HTTPException(400, f"Unknown sector '{sector}'")
    return news_service.live_deals(sector, days, limit)


@app.get("/deals/filings")
@limiter.limit("30/minute")
def deals_filings(request: Request, limit: int = Query(60, ge=1, le=150)):
    return news_service.sec_deal_filings(limit)


@app.get("/market/tape")
@limiter.limit("60/minute")
def market_tape(request: Request):
    return news_service.market_tape()


@app.get("/deals")
@limiter.limit("20/minute")
def deals_endpoint(request: Request):
    return {"deals": list_deals()}


@app.get("/company/{ticker}")
@limiter.limit("30/minute")
def company_endpoint(request: Request, ticker: str):
    try:
        d = get_financials(ticker).to_dict()
        d["sector"] = sector_of(ticker)
        return d
    except DataError as e:
        raise HTTPException(404, str(e))


class ValuationOverrides(BaseModel):
    growth_start: float | None = None
    growth_end: float | None = None
    fcf_margin_target: float | None = None
    wacc: float | None = None
    terminal_g: float | None = None
    premium_low: float | None = None
    premium_high: float | None = None
    peers: list[str] | None = None


@app.post("/valuate/{ticker}")
@limiter.limit("20/minute")
def valuate_endpoint(request: Request, ticker: str, overrides: ValuationOverrides = ValuationOverrides()):
    try:
        return valuate(ticker, overrides.model_dump(exclude={"peers"}), overrides.peers)
    except DataError as e:
        raise HTTPException(404, str(e))
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/valuate/{ticker}/report")
@limiter.limit("15/minute")
def valuation_report_endpoint(request: Request, ticker: str, overrides: ValuationOverrides = ValuationOverrides()):
    try:
        v = valuate(ticker, overrides.model_dump(exclude={"peers"}), overrides.peers)
    except DataError as e:
        raise HTTPException(404, str(e))
    except ValueError as e:
        raise HTTPException(400, str(e))
    name = v["company"]["name"]
    pdf = valuation_to_pdf_bytes(name, ticker.upper(), v)
    return Response(content=pdf, media_type="application/pdf",
                     headers={"Content-Disposition": f'attachment; filename="{ticker.upper()}_report.pdf"'})


class MemoRequest(BaseModel):
    valuation: dict
    screening: dict | None = None
    thesis_note: str | None = None


@app.post("/memo")
@limiter.limit("10/minute")
async def memo_endpoint(request: Request, body: MemoRequest):
    payload = {"company": body.valuation.get("company"), "assumptions": body.valuation.get("assumptions"),
               "dcf": body.valuation.get("dcf"), "comps_implied": body.valuation.get("comps", {}).get("implied"),
               "football_field": body.valuation.get("football"), "screening": body.screening,
               "analyst_note": body.thesis_note}
    try:
        memo = await generate_memo(payload)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(502, f"Memo generation failed: {e}")
    return {"memo": memo, "company_name": (body.valuation.get("company") or {}).get("name", "Target")}


class PdfRequest(BaseModel):
    company_name: str
    memo: dict


@app.post("/memo/pdf")
@limiter.limit("10/minute")
def memo_pdf_endpoint(request: Request, body: PdfRequest):
    pdf = memo_to_pdf_bytes(body.company_name, body.memo)
    return Response(content=pdf, media_type="application/pdf",
                     headers={"Content-Disposition": f'attachment; filename="{body.company_name}_memo.pdf"'})