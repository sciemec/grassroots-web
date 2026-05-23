"""
Test Option D — Arena as home base
1. Logged-out user lands on landing page (no redirect to /arena)
2. Login with player account redirects to /arena
3. Visiting grassrootssports.live while logged in redirects to /arena
"""
from playwright.sync_api import sync_playwright
import time

BASE = "https://grassrootssports.live"
LOGIN_EMAIL = "player@grassrootssports.live"
LOGIN_PASS  = "Player123!"

PASS = "[PASS]"
FAIL = "[FAIL]"

def check(label, condition, actual=""):
    status = PASS if condition else FAIL
    print(f"{status}  {label}")
    if not condition and actual:
        print(f"       actual: {actual}")
    return condition

def main():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ── Test 1: Logged-out user sees landing page ─────────────────────────
        print("\n--- Test 1: Logged-out visitor ---")
        page = browser.new_page()
        page.goto(BASE, wait_until="networkidle", timeout=30000)
        time.sleep(2)  # let AuthRedirect hydrate + potentially fire

        url_after = page.url
        on_landing = "/arena" not in url_after
        results.append(check(
            "Logged-out -> stays on landing page (no redirect to /arena)",
            on_landing, url_after
        ))
        # Check landing page content is visible
        has_hero = page.locator("text=Grassroots").count() > 0 or page.locator("text=GrassRoots").count() > 0
        results.append(check("Landing page content is visible", has_hero))
        page.screenshot(path="/tmp/test1_loggedout.png")
        page.close()

        # ── Test 2: Login → redirects to /arena ───────────────────────────────
        print("\n--- Test 2: Login redirects to /arena ---")
        page = browser.new_page()
        page.goto(f"{BASE}/login", wait_until="networkidle", timeout=30000)

        # Fill credentials
        page.locator('input[type="text"], input[type="email"]').first.fill(LOGIN_EMAIL)
        page.locator('input[type="password"]').fill(LOGIN_PASS)
        page.screenshot(path="/tmp/test2_login_filled.png")

        # Submit
        page.locator('button[type="submit"]').click()
        page.wait_for_load_state("networkidle", timeout=15000)
        # Wait up to 8s for client-side redirect to /arena after hydration
        try:
            page.wait_for_url("**/arena**", timeout=8000)
        except Exception:
            pass  # capture whatever URL we ended up on
        time.sleep(1)

        post_login_url = page.url
        landed_arena = "/arena" in post_login_url
        results.append(check(
            f"Login -> redirected to /arena (got: {post_login_url.split(BASE)[-1]})",
            landed_arena, post_login_url
        ))
        page.screenshot(path="/tmp/test2_after_login.png")

        # ── Test 3: Logged-in user visits root → /arena ────────────────────────
        print("\n--- Test 3: Logged-in user visits root URL ---")
        page.goto(BASE, wait_until="networkidle", timeout=30000)
        time.sleep(3)  # wait for hydration + AuthRedirect

        final_url = page.url
        redirected_to_arena = "/arena" in final_url
        results.append(check(
            f"Logged-in -> visiting root redirects to /arena (got: {final_url.split(BASE)[-1]})",
            redirected_to_arena, final_url
        ))
        page.screenshot(path="/tmp/test3_loggedin_root.png")

        # Check Arena page content
        arena_content = page.locator("text=The Arena").count() > 0 or page.locator("text=Arena").count() > 0
        results.append(check("Arena page content visible after redirect", arena_content))
        page.screenshot(path="/tmp/test3_arena_content.png")

        browser.close()

    # ── Summary ────────────────────────────────────────────────────────────────
    passed = sum(results)
    total  = len(results)
    print(f"\n{'='*55}")
    print(f"Results: {passed}/{total} passed")
    if passed == total:
        print("Option D is fully working on the live site!")
    else:
        print(f"{total - passed} test(s) failed -- check screenshots in /tmp/")
    print(f"{'='*55}")
    print("\nScreenshots saved:")
    print("  /tmp/test1_loggedout.png     — logged-out landing page")
    print("  /tmp/test2_login_filled.png  — login form filled")
    print("  /tmp/test2_after_login.png   — page after login")
    print("  /tmp/test3_loggedin_root.png — root visit while logged in")
    print("  /tmp/test3_arena_content.png — final Arena page")

if __name__ == "__main__":
    main()
