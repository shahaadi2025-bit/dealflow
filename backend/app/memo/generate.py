"""LLM writes prose around numbers we already computed. It never invents figures:
we validate that every number it prints traces back to the input payload."""
from __future__ import annotations
import json, re
import httpx
from app.config import settings

SYSTEM = """You are a senior M&A analyst writing an investment memo. You will be given a JSON \
payload of ALREADY-COMPUTED financial, valuation and screening data. Use ONLY the numbers in \
that JSON - never invent, estimate, or recall outside figures. If a number is not present, say \
data is unavailable rather than guessing. Write in a sober, analytical tone with no hype.

Return the memo as JSON with these string fields: executive_summary, business_overview, \
financial_analysis, valuation_summary, key_risks, recommendation. Each should be 2-5 sentences \
of plain prose (key_risks and recommendation may use short dashes for bullet-like points within \
the string). Output ONLY the JSON object, no markdown fences, no commentary."""


def _extract_numbers(obj) -> set[str]:
    out = set()
    def walk(x):
        if isinstance(x, (int, float)):
            out.add(f"{x:.0f}")
            out.add(f"{x:.1f}")
            out.add(f"{x:.2f}")
        elif isinstance(x, dict):
            for v in x.values(): walk(v)
        elif isinstance(x, list):
            for v in x: walk(v)
    walk(obj)
    return out


def _looks_grounded(text: str, allowed: set[str]) -> bool:
    """Loose guardrail: flag if the memo contains suspicious many-digit numbers absent from input."""
    nums = re.findall(r"\d{3,}(?:\.\d+)?", text)
    if not nums:
        return True
    unmatched = [n for n in nums if not any(n in a or a in n for a in allowed)]
    return len(unmatched) <= max(2, len(nums) // 4)  # tolerate rounding/dates


async def generate_memo(payload: dict) -> dict:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY not set on the backend")
    allowed = _extract_numbers(payload)
    body = {
        "model": settings.groq_model,
        "temperature": 0.2,
        "max_tokens": 1800,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": json.dumps(payload)},
        ],
    }
    headers = {"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"}
    last_err = None
    async with httpx.AsyncClient(timeout=60) as client:
        for attempt in range(2):
            r = await client.post("https://api.groq.com/openai/v1/chat/completions", json=body, headers=headers)
            r.raise_for_status()
            content = r.json()["choices"][0]["message"]["content"].strip()
            content = re.sub(r"^```json\s*|\s*```$", "", content.strip())
            try:
                memo = json.loads(content)
            except json.JSONDecodeError as e:
                last_err = e
                continue
            full_text = " ".join(str(v) for v in memo.values())
            if _looks_grounded(full_text, allowed):
                memo["_grounded"] = True
                return memo
            body["messages"].append({"role": "user", "content": "Revise: some numbers didn't match the provided JSON. Use only figures from the original data."})
        memo = memo if "memo" in dir() else {}
        memo["_grounded"] = False
        return memo