"""Headline analysis: sentiment, topic tags, M&A detection, deal value/party extraction,
ticker and sector tagging. Pure functions, no network, fully unit-tested."""
from __future__ import annotations
import re
from functools import lru_cache

POS = {"beat", "beats", "surge", "surges", "soar", "soars", "jump", "jumps", "rally", "rallies", "gain", "gains",
       "rise", "rises", "record", "upgrade", "upgrades", "raises", "raised", "strong", "growth", "profit",
       "outperform", "wins", "win", "approval", "approved", "breakthrough", "expands", "boost", "boosts",
       "bullish", "tops", "climbs", "higher", "optimism", "buyback", "dividend"}
NEG = {"miss", "misses", "plunge", "plunges", "fall", "falls", "drop", "drops", "slump", "slumps", "tumble",
       "tumbles", "cut", "cuts", "downgrade", "downgrades", "lawsuit", "probe", "investigation", "recall",
       "layoffs", "layoff", "fraud", "bankruptcy", "warning", "warns", "weak", "loss", "losses", "lower",
       "bearish", "slides", "sinks", "halts", "fine", "fined", "delay", "delays", "terminated", "rejects"}

TAGS = {
    "Earnings": r"\b(earnings|eps|quarterly results|q[1-4] results|revenue (?:beats|misses)|guidance|outlook)\b",
    "M&A": r"\b(acquire|acquires|acquisition|acquired|merger|merge|takeover|buyout|tender offer|take[- ]private|to buy|agrees to buy)\b",
    "Analyst": r"\b(upgrade|downgrade|price target|initiates coverage|overweight|underweight|outperform)\b",
    "Regulatory": r"\b(sec|ftc|doj|antitrust|regulator|probe|investigation|lawsuit|fine[sd]?|approval|fda)\b",
    "Leadership": r"\b(ceo|cfo|chairman|steps down|appoints|names new|resigns)\b",
    "Capital": r"\b(ipo|offering|buyback|dividend|debt|notes|convertible|spin[- ]?off|stake)\b",
    "Product": r"\b(launch|launches|unveils|partnership|contract|wins deal|rollout)\b",
    "Macro": r"\b(fed|inflation|rates?|treasury|jobs report|gdp|cpi|tariff)\b",
}
_TAG_RE = {k: re.compile(v, re.I) for k, v in TAGS.items()}

_ACQ = re.compile(
    r"\b(to acquire|acquires|acquired|acquiring|to buy|buys|agrees to buy|bought|takeover|take[- ]private|"
    r"to take private|buyout|buy-out|merger|to merge|merges with|agrees to be acquired|definitive agreement|"
    r"tender offer|offers to buy|snaps up|to purchase|bid for|bids for|combine|combination|all-stock deal|all-cash deal|"
    r"acquisition of|completes acquisition|to be acquired)\b", re.I)
_NOT_DEAL = re.compile(
    r"\b(stocks? to buy|buy rating|buy now|best stocks?|should you buy|buy or sell|top picks?|buyback|share repurchase|"
    r"acquired immune|buy the dip|time to buy|worth buying|buy-and-hold|buy and hold|buy[- ]now[- ]pay[- ]later|"
    r"mortgage|real estate agent)\b", re.I)
_RUMOR = re.compile(r"\b(in talks|talks to|exploring|explores|weighs|considering|considers|eyes|eyeing|said to|reportedly|"
                    r"sounds out|approach(?:es|ed)?|rumou?r|could buy|may buy|nears|near deal|nearing)\b", re.I)
_DONE = re.compile(r"\b(completes|completed|closes|closed|finalizes|finalised|finalized|wraps up)\b", re.I)
_DEAD = re.compile(r"\b(terminate[sd]?|calls off|walks away|rejects|rejected|blocked|abandon(?:s|ed)?|scrapped|withdraws)\b", re.I)
_VALUE = re.compile(r"\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s?(trillion|tn|billion|bn|b|million|mn|m)\b", re.I)
_PARTIES = re.compile(
    r"^(?P<a>[A-Z][\w&.\-' ]{1,40}?)\s+(?:to acquire|acquires|to buy|buys|agrees to buy|snaps up|to purchase|"
    r"offers to buy|bids for|bid for|to take private|completes acquisition of|completes the acquisition of|agrees to acquire|"
    r"in talks to buy|in talks to acquire|nears deal to buy|nears deal to acquire|launches tender offer for|"
    r"to acquire stake in)\s+(?:(?:[a-z]+\s+){0,3})?"
    r"(?P<b>[A-Z][\w&.\-' ]{1,45}?)(?:\s+(?:for|in|at|from|to|with|valued|rival|firm|maker|developer|producer)\b|[,:;]|\s[-\u2013\u2014]\s|$)")
_SUFFIX = re.compile(r"\s+[-\u2013\u2014|]\s+[^-\u2013\u2014|]{2,40}$")

_MULT = {"trillion": 1e6, "tn": 1e6, "billion": 1e3, "bn": 1e3, "b": 1e3, "million": 1.0, "mn": 1.0, "m": 1.0}


def clean_title(title: str) -> str:
    t = re.sub(r"\s+", " ", (title or "")).strip()
    return t


def strip_source_suffix(title: str, source: str = "") -> str:
    t = clean_title(title)
    if source and t.lower().endswith(source.lower()):
        t = re.sub(r"\s*[-\u2013\u2014|]\s*" + re.escape(source) + r"\s*$", "", t, flags=re.I)
        return t
    m = _SUFFIX.search(t)
    if m and len(t) - len(m.group(0)) > 20:
        return t[: m.start()]
    return t


_NEUTRAL_PHRASES = re.compile(r"\b(rate cuts?|rate-cut|cut rates|tax cuts?|interest rates?)\b", re.I)


def sentiment(text: str) -> dict:
    words = re.findall(r"[a-z']+", _NEUTRAL_PHRASES.sub(" ", text or "").lower())
    pos = sum(1 for w in words if w in POS)
    neg = sum(1 for w in words if w in NEG)
    score = 0.0 if pos + neg == 0 else (pos - neg) / (pos + neg)
    label = "bullish" if score > 0.2 else "bearish" if score < -0.2 else "neutral"
    return {"score": round(score, 2), "label": label}


def tags_for(text: str) -> list[str]:
    return [k for k, rx in _TAG_RE.items() if rx.search(text or "")]


def is_deal(text: str) -> bool:
    return bool(_ACQ.search(text or "")) and not _NOT_DEAL.search(text or "")


def deal_status(text: str) -> str:
    if _DEAD.search(text):
        return "terminated"
    if _DONE.search(text):
        return "completed"
    if _RUMOR.search(text):
        return "rumor"
    return "announced"


def deal_type(text: str) -> str:
    t = text.lower()
    if "tender offer" in t:
        return "Tender offer"
    if re.search(r"take[- ]private|buyout|buy-out|leveraged", t):
        return "Take-private / buyout"
    if re.search(r"merger|merge|combin", t):
        return "Merger"
    return "Acquisition"


def deal_value_musd(text: str) -> float | None:
    best = None
    for m in _VALUE.finditer(text or ""):
        num = float(m.group(1).replace(",", ""))
        v = num * _MULT[m.group(2).lower()]
        best = v if best is None or v > best else best
    return best


def parties(title: str) -> tuple[str | None, str | None]:
    m = _PARTIES.match(clean_title(title))
    if not m:
        return None, None
    return m.group("a").strip(" ,"), m.group("b").strip(" ,")


def _norm_name(name: str) -> str:
    n = re.sub(r"[.,]", "", name or "")
    n = re.sub(r"\b(inc|corp|corporation|co|company|ltd|plc|holdings|holding|group|limited|llc|lp|sa|nv|ag|class [a-c]|the)\b", "", n, flags=re.I)
    return re.sub(r"\s+", " ", n).strip().lower()


_AMBIG = {"visa", "target", "apple", "square", "block", "gap", "oracle", "meta", "the", "stem", "ring", "box", "one", "twilio"}
_STOP_NAMES = {"general", "first", "american", "national", "united", "global", "international", "new", "us", "usa",
               "digital", "energy", "health", "capital", "financial", "systems", "technologies", "technology",
               "group", "software", "solutions", "industries", "partners", "resources", "services", "networks", "labs"}


@lru_cache(maxsize=1)
def _name_index() -> tuple[dict[str, str], set[str]]:
    """normalized company name -> ticker, built from the committed snapshot; plus known tickers."""
    try:
        from app.data.fetch import load_snapshot
        snap = load_snapshot()
    except Exception:
        snap = {}
    idx: dict[str, str] = {}
    for tk, f in snap.items():
        n = _norm_name(f.name)
        if len(n) >= 4 and n not in _STOP_NAMES and n not in _AMBIG:
            idx.setdefault(n, tk)
    return idx, set(snap)


_NOT_TICKERS = {"CEO", "CFO", "COO", "SEC", "FTC", "DOJ", "IPO", "GDP", "CPI", "ETF", "USA", "FED", "EPS", "NYSE",
                "USD", "EUR", "FDA", "EU", "UK", "AI", "ECB", "IMF", "OPEC", "ESG", "REIT", "LLC", "INC", "CORP", "NEW", "ALL", "ONE", "FOR", "ARE", "CAN", "NOW", "TWO"}

_TICKER_PATTERNS = [
    re.compile(r"\((?:NYSE|NASDAQ|NYSEARCA|AMEX|NYSEAMERICAN|TSX|LSE)\s*:\s*([A-Z.\-]{1,6})\)"),
    re.compile(r"\b(?:NYSE|NASDAQ)\s*:\s*([A-Z.\-]{1,6})\b"),
    re.compile(r"(?<![\w$])\$([A-Z]{1,5})\b"),
]


def tickers_in(text: str, limit: int = 4) -> list[str]:
    found: list[str] = []
    idx, known = _name_index()
    for m in re.finditer(r"\b([A-Z]{3,5})\b", text or ""):
        t = m.group(1)
        if t in known and t not in _NOT_TICKERS and t not in found:
            found.append(t)
    for rx in _TICKER_PATTERNS:
        for m in rx.finditer(text or ""):
            t = m.group(1).upper()
            if t not in found:
                found.append(t)
    low = " " + re.sub(r"[.,]", "", (text or "").lower()) + " "
    for name, tk in idx.items():
        if tk in found:
            continue
        if f" {name} " in low or f" {name}'s " in low or f" {name}, " in low:
            found.append(tk)
        if len(found) >= limit:
            break
    return found[:limit]


def sector_for_ticker(t: str) -> str | None:
    from app.data.universe import UNIVERSES
    t = t.upper()
    broad = {"saas", "cloud_infra", "consumer", "ecommerce", "financials"}
    hits = [s for s, lst in UNIVERSES.items() if t in lst]
    specific = [s for s in hits if s not in broad]
    return (specific or hits or [None])[0]


_SECTOR_RX: dict[str, re.Pattern] | None = None


def sectors_from_text(text: str, tickers: list[str]) -> list[str]:
    out: list[str] = []
    for t in tickers:
        s = sector_for_ticker(t)
        if s and s not in out:
            out.append(s)
    if out:
        return out[:3]
    global _SECTOR_RX
    if _SECTOR_RX is None:
        kw = {
            "saas": r"\b(saas|software)\b", "fintech": r"\b(fintech|payments?)\b", "ev": r"\b(electric vehicles?|ev maker|ev battery)\b",
            "healthcare": r"\b(hospital|health system|healthcare|pharma)\b", "cyber": r"\b(cybersecurity|cyber security)\b",
            "cloud_infra": r"\b(data cent(?:er|re)s?|cloud infrastructure)\b", "media": r"\b(streaming|broadcaster|studio)\b",
            "semis": r"\b(semiconductors?|chipmaker|chips?)\b", "real_estate": r"\b(reit|real estate|property)\b",
            "energy": r"\b(oil|natural gas|midstream|shale|lng)\b", "aerospace_defense": r"\b(defen[sc]e|aerospace)\b",
            "telecom": r"\b(telecom|wireless|broadband)\b", "renewables": r"\b(solar|hydrogen|wind power|clean energy|nuclear)\b",
            "financials": r"\b(bank|asset manager|brokerage)\b", "logistics": r"\b(freight|logistics|trucking|railroad|airline)\b",
            "ecommerce": r"\b(e-commerce|online retailer|marketplace)\b", "medtech": r"\b(medical device|medtech|diagnostics)\b",
            "biotech": r"\b(biotech|biopharma|gene therapy|drug developer)\b", "materials": r"\b(mining|miner|lithium|steel|chemicals?)\b",
            "travel": r"\b(hotel|cruise|casino|resort)\b", "staples": r"\b(packaged food|beverage|snack|household products)\b",
            "insurance": r"\b(insurer|insurance|reinsurance)\b", "utilities": r"\b(utility|utilities|power grid)\b",
            "autos": r"\b(automaker|auto parts|car dealer)\b", "gaming": r"\b(video games?|gaming|esports|sports betting)\b",
            "edtech": r"\b(edtech|online learning|university)\b", "agriculture": r"\b(agricultur\w*|fertilizer|grain|farm equipment)\b",
            "industrials": r"\b(industrial|manufacturer|machinery)\b", "consumer": r"\b(retailer|restaurant|consumer brand)\b",
        }
        _SECTOR_RX = {k: re.compile(v, re.I) for k, v in kw.items()}
    for s, rx in _SECTOR_RX.items():
        if rx.search(text or ""):
            out.append(s)
    return out[:2]


def enrich(item: dict) -> dict:
    """Add sentiment, tags, tickers, sectors (and deal fields when it is an M&A headline)."""
    text = f'{item.get("title", "")} {item.get("summary", "")}'
    title = item.get("title", "")
    item["sentiment"] = sentiment(title)
    item["tags"] = tags_for(title)
    item["tickers"] = tickers_in(title)
    item["sectors"] = sectors_from_text(text, item["tickers"])
    item["is_deal"] = is_deal(title)
    if item["is_deal"]:
        a, b = parties(title)
        item["deal"] = {
            "status": deal_status(title), "type": deal_type(title),
            "value_musd": deal_value_musd(text), "acquirer": a, "target": b,
        }
        if "M&A" not in item["tags"]:
            item["tags"].append("M&A")
    return item
