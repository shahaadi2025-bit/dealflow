"""Optional daily deal digest. Silently does nothing unless SMTP_HOST/SMTP_USER/SMTP_PASS/DIGEST_TO are set."""
import os, smtplib, sys
from email.message import EmailMessage
from app.news import history


def build(records: list[dict], limit: int = 15) -> str:
    rows = [f"- {r['title']} ({r.get('status') or 'reported'}) {r['link']}" for r in records[:limit]]
    return "Latest M&A deals detected by DealFlow:\n\n" + "\n".join(rows) if rows else ""


def main() -> int:
    env = {k: os.environ.get(k) for k in ("SMTP_HOST", "SMTP_USER", "SMTP_PASS", "DIGEST_TO")}
    if not all(env.values()):
        print("digest not configured; skipping")
        return 0
    body = build(history.load())
    if not body:
        print("no deals; skipping")
        return 0
    msg = EmailMessage()
    msg["Subject"], msg["From"], msg["To"] = "DealFlow deal digest", env["SMTP_USER"], env["DIGEST_TO"]
    msg.set_content(body)
    with smtplib.SMTP(env["SMTP_HOST"], 587) as s:
        s.starttls()
        s.login(env["SMTP_USER"], env["SMTP_PASS"])
        s.send_message(msg)
    print("digest sent")
    return 0


if __name__ == "__main__":
    sys.exit(main())
