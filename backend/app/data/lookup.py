from app.data.universe import UNIVERSES, REFERENCE_TICKERS

# name hints for reference tickers so autocomplete can match by company name too,
# not just ticker symbol. Sector universe names come from live data once fetched;
# for instant autocomplete we keep a small static hint map for the big reference names.
NAME_HINTS = {
    "AAPL": "Apple Inc", "MSFT": "Microsoft Corporation", "GOOGL": "Alphabet Inc (Class A)",
    "GOOG": "Alphabet Inc (Class C)", "AMZN": "Amazon.com Inc", "META": "Meta Platforms Inc",
    "NVDA": "NVIDIA Corporation", "JPM": "JPMorgan Chase & Co", "V": "Visa Inc",
    "WMT": "Walmart Inc", "PG": "Procter & Gamble", "HD": "Home Depot Inc",
    "CRM": "Salesforce Inc", "ADBE": "Adobe Inc", "NFLX": "Netflix Inc",
    "TSLA": "Tesla Inc", "COST": "Costco Wholesale", "ORCL": "Oracle Corporation",
}

def all_known_tickers() -> list[dict]:
    seen = set()
    out = []
    for tickers in UNIVERSES.values():
        for t in tickers:
            if t not in seen:
                seen.add(t)
                out.append({"ticker": t, "name": NAME_HINTS.get(t, "")})
    for t in REFERENCE_TICKERS:
        if t not in seen:
            seen.add(t)
            out.append({"ticker": t, "name": NAME_HINTS.get(t, "")})
    return out

def search_tickers(q: str, limit: int = 8) -> list[dict]:
    q = q.strip().upper()
    if not q:
        return []
    all_t = all_known_tickers()
    starts = [t for t in all_t if t["ticker"].startswith(q)]
    contains = [t for t in all_t if q in t["ticker"] and t not in starts]
    name_match = [t for t in all_t if t["name"] and q in t["name"].upper() and t not in starts and t not in contains]
    return (starts + contains + name_match)[:limit]