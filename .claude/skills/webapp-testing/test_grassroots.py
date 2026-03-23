from playwright.sync_api import sync_playwright
import os, time

SCREENSHOTS = r"C:\Users\HP\AppData\Local\Temp\grassroots_tests"
os.makedirs(SCREENSHOTS, exist_ok=True)

results = []

def check(label, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    results.append(f"[{status}] {label}" + (f" — {detail}" if detail else ""))
    print(results[-1])

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    # ── 1. Landing page ──────────────────────────────────────────────
    print("\n=== 1. Landing page ===")
    page.goto("https://grassrootssports.live", timeout=30000)
    page.wait_for_load_state("networkidle", timeout=30000)
    page.screenshot(path=f"{SCREENSHOTS}/01_landing.png", full_page=True)
    body = page.content().lower()
    check("Landing page loads", page.url.startswith("https://grassrootssports.live"))
    check("Has headline text", "grassroots" in body or "zimbabwe" in body or "sports" in body)
    links = [a.get_attribute("href") or "" for a in page.locator("a").all()]
    has_login = any("login" in l or "sign" in l.lower() for l in links)
    check("Has login/sign-in link", has_login)

    # ── 2. Login page ─────────────────────────────────────────────────
    print("\n=== 2. Login page ===")
    page.goto("https://grassrootssports.live/login", timeout=20000)
    page.wait_for_load_state("networkidle", timeout=20000)
    time.sleep(1)
    page.screenshot(path=f"{SCREENSHOTS}/02_login.png", full_page=True)
    has_email = page.locator("input[type='email'], input[name='email']").count() > 0
    has_pw    = page.locator("input[type='password']").count() > 0
    check("Login page has email field", has_email)
    check("Login page has password field", has_pw)

    # ── 3. Sign in ────────────────────────────────────────────────────
    print("\n=== 3. Sign in ===")
    try:
        page.locator("input[type='email'], input[name='email']").first.fill("nnygel@live.com")
        page.locator("input[type='password']").first.fill("test1234")
        page.locator("button[type='submit'], button:has-text('Sign'), button:has-text('Login'), button:has-text('Log in')").first.click()
        page.wait_for_load_state("networkidle", timeout=20000)
        time.sleep(2)
        page.screenshot(path=f"{SCREENSHOTS}/03_after_login.png", full_page=True)
        redirected_url = page.url
        check("Login redirected away from /login", "/login" not in redirected_url, redirected_url)
    except Exception as e:
        check("Login flow", False, str(e))
        redirected_url = page.url

    # ── 4. Analyst hub ───────────────────────────────────────────────
    print("\n=== 4. Analyst hub ===")
    page.goto("https://grassrootssports.live/analyst", timeout=20000)
    page.wait_for_load_state("networkidle", timeout=20000)
    time.sleep(1)
    page.screenshot(path=f"{SCREENSHOTS}/04_analyst_hub.png", full_page=True)
    body = page.content().lower()
    check("Analyst hub loads", "analyst" in body or "match" in body or "xg" in body)
    check("Has tool cards", page.locator("[class*='card'], [class*='rounded'], a[href*='analyst']").count() > 2)

    # ── 5. Tactical report ───────────────────────────────────────────
    print("\n=== 5. Tactical report ===")
    page.goto("https://grassrootssports.live/analyst/tactical-report", timeout=20000)
    page.wait_for_load_state("networkidle", timeout=20000)
    time.sleep(1)
    page.screenshot(path=f"{SCREENSHOTS}/05_tactical_report.png", full_page=True)
    has_form = page.locator("input, textarea").count() > 0
    has_btn  = page.locator("button:has-text('Generate'), button:has-text('Report')").count() > 0
    check("Tactical report form loads", has_form)
    check("Has generate button", has_btn)

    # ── 6. Live match ─────────────────────────────────────────────────
    print("\n=== 6. Live match ===")
    page.goto("https://grassrootssports.live/analyst/live-match", timeout=20000)
    page.wait_for_load_state("networkidle", timeout=20000)
    time.sleep(1)
    page.screenshot(path=f"{SCREENSHOTS}/06_live_match.png", full_page=True)
    body = page.content().lower()
    check("Live match page loads", "match" in body or "xg" in body or "zone" in body or "home" in body)
    check("Has pitch/team inputs", page.locator("input, button").count() > 2)

    # ── 7. Fan hub ────────────────────────────────────────────────────
    print("\n=== 7. Fan hub ===")
    page.goto("https://grassrootssports.live/fan", timeout=20000)
    page.wait_for_load_state("networkidle", timeout=20000)
    time.sleep(1)
    page.screenshot(path=f"{SCREENSHOTS}/07_fan_hub.png", full_page=True)
    body = page.content().lower()
    check("Fan hub loads", "fan" in body or "discover" in body or "follow" in body or "leaderboard" in body)

    # ── 8. Business hub ───────────────────────────────────────────────
    print("\n=== 8. Business hub ===")
    page.goto("https://grassrootssports.live/business-hub", timeout=20000)
    page.wait_for_load_state("networkidle", timeout=20000)
    time.sleep(1)
    page.screenshot(path=f"{SCREENSHOTS}/08_business_hub.png", full_page=True)
    body = page.content().lower()
    check("Business hub loads", "business" in body or "budget" in body or "sponsor" in body)

    browser.close()

print("\n" + "="*50)
print("RESULTS SUMMARY")
print("="*50)
for r in results:
    print(r)
print(f"\nScreenshots saved to: {SCREENSHOTS}")
