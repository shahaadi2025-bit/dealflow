"""Send new archived deals that match data/watch.json to Telegram.
Does nothing unless TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set. Remembers what it sent in data/notified.json."""
import json, os, sys, urllib.parse, urllib.request
from pathlib import Path
from app.news import history

DATA = Path(__file__).resolve().parents[2] / "data"
WATCH, SENT = DATA / "watch.json", DATA / "notified.json"


def _load(p: Path, default):
    try:
        return json.loads(p.read_text(encoding="utf-8-sig"))
    except Exception:
        return default


def matches(rule: dict, rec: dict) -> bool:
    if rule.get("tickers") and not {t.upper() for t in rule["tickers"]} & set(rec.get("tickers") or []):
        return False
    if rule.get("sectors") and not set(rule["sectors"]) & set(rec.get("sectors") or []):
        return False
    if rule.get("min_value_musd") and (rec.get("value_musd") or 0) < rule["min_value_musd"]:
        return False
    if rule.get("keyword") and rule["keyword"].lower() not in (rec.get("title") or "").lower():
        return False
    return bool({k for k in rule if not k.startswith("_")})


def select(records: list[dict], rules: list[dict], sent: set[str]) -> list[dict]:
    return [r for r in records if r["id"] not in sent and any(matches(x, r) for x in rules)]


def fmt(r: dict) -> str:
    v = f" (${r['value_musd']:,.0f}M)" if r.get("value_musd") else ""
    return f"{r['title']}{v}\n{r['link']}"


def send(token: str, chat: str, text: str) -> None:
    data = urllib.parse.urlencode({"chat_id": chat, "text": text, "disable_web_page_preview": "true"}).encode()
    urllib.request.urlopen(f"https://api.telegram.org/bot{token}/sendMessage", data=data, timeout=20).read()


def main() -> int:
    token, chat = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat:
        print("telegram not configured; skipping")
        return 0
    records = history.load()
    state = _load(SENT, {"ids": []})
    first_run = not state["ids"]
    sent = set(state["ids"])
    if first_run:  # don't flood: mark the existing archive as seen
        state["ids"] = [r["id"] for r in records][-2000:]
        SENT.write_text(json.dumps(state), encoding="utf-8")
        print("first run: baseline saved")
        return 0
    todo = select(records, _load(WATCH, {}).get("rules", []), sent)
    for r in todo[:10]:
        try:
            send(token, chat, "DealFlow alert\n" + fmt(r))
        except Exception as e:
            print("send failed:", e)
            break
    state["ids"] = list(dict.fromkeys(state["ids"] + [r["id"] for r in records]))[-2000:]
    SENT.write_text(json.dumps(state), encoding="utf-8")
    print(f"notified {min(len(todo), 10)} deals")
    return 0


if __name__ == "__main__":
    sys.exit(main())
