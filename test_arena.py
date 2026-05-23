from playwright.sync_api import sync_playwright
import time

BASE = "https://grassrootssports.live"

def test_arena():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        # ── Step 1: Login ────────────────────────────────────────────────────
        print("=== Step 1: Login ===")
        page.goto(f"{BASE}/login")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="D:/bhora-ai/grassroots-web/arena_01_login.png")

        page.fill("input[type='email'], input[name='email']", "player@grassrootssports.live")
        page.fill("input[type='password'], input[name='password']", "Player123!")
        page.click("button[type='submit'], button:has-text('Sign In'), button:has-text('Login')")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="D:/bhora-ai/grassroots-web/arena_02_after_login.png")
        print(f"  After login URL: {page.url}")

        # ── Step 2: Navigate to /arena ──────────────────────────────────────
        print("\n=== Step 2: Navigate to /arena ===")
        page.goto(f"{BASE}/arena")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path="D:/bhora-ai/grassroots-web/arena_03_feed_page.png", full_page=True)
        print(f"  URL: {page.url}")
        print(f"  Title: {page.title()}")

        # Check key elements
        nav_visible = page.is_visible("header")
        nav_text = page.inner_text("header") if nav_visible else ""
        textarea_visible = page.locator("textarea").count() > 0
        print(f"  {'✅' if nav_visible else '❌'} ArenaNav header present")
        print(f"  {'✅' if 'The Arena' in nav_text else '❌'} 'The Arena' branding in header")
        print(f"  {'✅' if textarea_visible else '❌'} Post composer (textarea) present")

        # Check feed tabs
        tab_text = page.inner_text("main") if page.locator("main").count() > 0 else ""
        has_tabs = "for you" in tab_text.lower() or "following" in tab_text.lower()
        print(f"  {'✅' if has_tabs else '❌'} Feed tabs visible")

        # ── Step 3: Expand composer and write a post ─────────────────────────
        print("\n=== Step 3: Write and submit a post ===")
        textarea = page.locator("textarea").first
        textarea.click()
        page.wait_for_timeout(800)
        textarea.fill("Testing the Arena Activity Feed — Sprint 2 is live! Built for Zimbabwean athletes.")
        page.wait_for_timeout(300)

        sport_inputs = page.locator("input[placeholder*='Sport'], input[placeholder*='sport']")
        if sport_inputs.count() > 0:
            sport_inputs.first.fill("Football")
            print("  ✅ Sport tag filled")

        province_inputs = page.locator("input[placeholder*='Province'], input[placeholder*='province']")
        if province_inputs.count() > 0:
            province_inputs.first.fill("Harare")
            print("  ✅ Province tag filled")

        page.screenshot(path="D:/bhora-ai/grassroots-web/arena_04_composer.png")

        post_btn = page.locator("button:has-text('Post')").last
        if post_btn.count() > 0 and post_btn.is_visible():
            post_btn.click()
            page.wait_for_timeout(3000)
            page.screenshot(path="D:/bhora-ai/grassroots-web/arena_05_after_post.png", full_page=True)
            print("  ✅ Post submitted — checking feed for new post")
            feed_text = page.inner_text("main")
            has_post = "Arena Activity Feed" in feed_text or "Sprint 2" in feed_text
            print(f"  {'✅' if has_post else '⚠️ '} New post visible in feed")
        else:
            print("  ❌ Post button not visible")

        # ── Step 4: Test tabs ─────────────────────────────────────────────────
        print("\n=== Step 4: Tab navigation ===")
        for tab_label in ["Following", "Connections"]:
            btn = page.locator(f"button:has-text('{tab_label}')").first
            if btn.count() > 0 and btn.is_visible():
                btn.click()
                page.wait_for_timeout(1500)
                print(f"  ✅ '{tab_label}' tab loads without error")
            else:
                print(f"  ❌ '{tab_label}' tab button not found")

        # Back to For You
        for_you = page.locator("button").filter(has_text="for you")
        if for_you.count() == 0:
            for_you = page.locator("button").filter(has_text="For You")
        if for_you.count() > 0:
            for_you.first.click()
            page.wait_for_timeout(1500)
            print("  ✅ 'For You' tab back")

        # ── Step 5: Like a post ───────────────────────────────────────────────
        print("\n=== Step 5: Like interaction ===")
        # Find first heart button (SVG button in post cards)
        like_buttons = page.locator("main button").all()
        heart_found = False
        for btn in like_buttons:
            try:
                text = btn.inner_text().strip()
                if text == "" or text.isdigit():
                    # Could be the like button (no text or just a count)
                    aria = btn.get_attribute("class") or ""
                    if "heart" in aria.lower() or btn.locator("svg").count() > 0:
                        btn.click()
                        page.wait_for_timeout(1000)
                        page.screenshot(path="D:/bhora-ai/grassroots-web/arena_06_liked.png")
                        print("  ✅ Clicked like button")
                        heart_found = True
                        break
            except Exception:
                pass
        if not heart_found:
            print("  ⚠️  Like button not found (may be no posts yet)")

        # ── Step 6: Console check ─────────────────────────────────────────────
        print("\n=== Step 6: Console errors ===")
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.reload()
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        if console_errors:
            for err in console_errors[:5]:
                print(f"  ❌ {err}")
        else:
            print("  ✅ No JS console errors")

        # ── Step 7: Mobile ────────────────────────────────────────────────────
        print("\n=== Step 7: Mobile layout (375px) ===")
        page.set_viewport_size({"width": 375, "height": 812})
        page.goto(f"{BASE}/arena")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        page.screenshot(path="D:/bhora-ai/grassroots-web/arena_07_mobile.png", full_page=True)
        mob_text = page.inner_text("body")
        print(f"  {'✅' if 'The Arena' in mob_text else '❌'} Loads on mobile")
        print(f"  ✅ Mobile screenshot saved")

        browser.close()
        print("\n=== All tests complete. Screenshots: arena_0*.png ===")

test_arena()
