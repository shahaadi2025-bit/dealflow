"""Smoke test: every page renders and nothing overflows horizontally at 390px.
Usage: BASE=http://localhost:3000 python frontend/tests/smoke.py   (pip install playwright; playwright install chromium)"""
import os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3000")
PAGES = ["/", "/screener", "/sectors", "/deals", "/news", "/alerts", "/pipeline", "/compare", "/methodology", "/memo"]
bad = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 390, "height": 800})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    for path in PAGES:
        pg.goto(BASE + path, wait_until="load")
        pg.wait_for_timeout(1500)
        w = pg.evaluate("document.documentElement.scrollWidth")
        h1 = pg.locator("h1").count()
        print(f"{path:14} scrollWidth={w} h1={h1}")
        if w > 390: bad.append(f"{path}: horizontal overflow {w}px")
        if path not in ("/memo", "/compare") and h1 == 0: bad.append(f"{path}: no h1")
    b.close()
if errors: bad += [f"js error: {e}" for e in errors]
if bad:
    print("FAIL:\n" + "\n".join(bad)); sys.exit(1)
print("smoke ok")
