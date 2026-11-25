/**
 * Sponsorship wizard — draft persistence E2E test
 *
 * Run against live site:
 *   BASE_URL=https://grassrootssports.live \
 *   TEST_EMAIL=player@grassrootssports.live \
 *   TEST_PASSWORD=<password> \
 *   npx playwright test sponsorship-wizard-draft --project=chromium --headed
 *
 * Credentials must be supplied via env vars — never hardcoded.
 */
import { test, expect, type Page } from "@playwright/test";

const BASE_EMAIL = process.env.TEST_EMAIL ?? "player@grassrootssports.live";

async function login(page: Page) {
  if (!process.env.TEST_PASSWORD) throw new Error("TEST_PASSWORD env var required");
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(BASE_EMAIL);
  await page.locator('input[type="password"]').fill(process.env.TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
}

test.describe("Sponsorship wizard — draft persistence", () => {
  test("Save draft on step 3 → reload → same case + step 3 + text restored", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page);

    // Force a new wizard so any existing draft doesn't redirect us immediately
    await page.goto("/sponsorships/new?new=1");
    await expect(page.getByText("Step 1 of 6")).toBeVisible({ timeout: 15_000 });

    // ── Step 1: Basics ────────────────────────────────────────────────────────
    const uniqueTitle = `E2E Draft ${Date.now()}`;
    await page.locator('input[placeholder*="Tinotenda"]').fill(uniqueTitle);
    await page.getByRole("button", { name: "Football" }).click();
    await page.locator("select").first().selectOption("kit_and_equipment");
    await page.getByRole("button", { name: "Create Draft & Continue" }).click();

    // URL must now contain ?case= after draft is created
    await page.waitForURL(/[?&]case=/, { timeout: 15_000 });
    const caseId = new URL(page.url()).searchParams.get("case");
    expect(caseId).toBeTruthy();
    console.log("Draft case ID:", caseId);

    // ── Step 2: Athlete ───────────────────────────────────────────────────────
    await expect(page.getByText("Step 2 of 6")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "18+" }).click();
    await page.getByRole("button", { name: "Save & Continue" }).click();

    // ── Step 3: Story & Needs ─────────────────────────────────────────────────
    await expect(page.getByText("Step 3 of 6")).toBeVisible({ timeout: 10_000 });
    const storyText = `E2E test story unique marker ${Date.now()}`;
    await page.locator("textarea").first().fill(storyText);
    // Select first support method via its label
    await page.getByLabel("Items delivered directly to the athlete").click();

    // Click "Save draft" and wait for confirmation banner
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText(/Saved ✓.*close this page/i)).toBeVisible({ timeout: 15_000 });

    // ── Reload and verify full resume ─────────────────────────────────────────
    await page.reload();
    await page.waitForURL(/[?&]case=/, { timeout: 15_000 });

    const resumedCaseId = new URL(page.url()).searchParams.get("case");
    expect(resumedCaseId).toBe(caseId);                                             // ✓ same case

    await expect(page.getByText("Step 3 of 6")).toBeVisible({ timeout: 15_000 });   // ✓ step 3
    await expect(page.locator("textarea").first()).toHaveValue(storyText, { timeout: 10_000 }); // ✓ text
  });

  test("Save draft on step 2 → close → reopen /sponsorships/new → step 2 + fields", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    // Start a fresh wizard
    await page.goto("/sponsorships/new?new=1");
    await expect(page.getByText("Step 1 of 6")).toBeVisible({ timeout: 15_000 });

    // ── Step 1 ────────────────────────────────────────────────────────────────
    const uniqueTitle = `E2E Step2 Draft ${Date.now()}`;
    await page.locator('input[placeholder*="Tinotenda"]').fill(uniqueTitle);
    await page.getByRole("button", { name: "Football" }).click();
    await page.locator("select").first().selectOption("kit_and_equipment");
    await page.getByRole("button", { name: "Create Draft & Continue" }).click();

    await page.waitForURL(/[?&]case=/, { timeout: 15_000 });
    const caseId = new URL(page.url()).searchParams.get("case");
    expect(caseId).toBeTruthy();

    // ── Step 2: fill Province, then Save draft ────────────────────────────────
    await expect(page.getByText("Step 2 of 6")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "18+" }).click();
    await page.locator('input[placeholder*="Harare"]').fill("Bulawayo");

    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText(/Saved ✓.*close this page/i)).toBeVisible({ timeout: 15_000 });

    // ── Simulate closing tab: navigate away then come back via /sponsorships/new
    await page.goto("about:blank");
    await page.goto("/sponsorships/new");

    // Must redirect to ?case= (auto-redirect)
    await page.waitForURL(/[?&]case=/, { timeout: 20_000 });
    const resumedCaseId = new URL(page.url()).searchParams.get("case");
    expect(resumedCaseId).toBe(caseId);                                            // ✓ same case

    await expect(page.getByText("Step 2 of 6")).toBeVisible({ timeout: 15_000 }); // ✓ step 2
    await expect(page.locator('input[placeholder*="Harare"]'))
      .toHaveValue("Bulawayo", { timeout: 10_000 });                               // ✓ field restored
  });

  test("Visiting /sponsorships/new when draft exists → redirects, no new draft", async ({ page }) => {
    test.setTimeout(30_000);
    await login(page);

    // Should auto-redirect to ?case=...
    await page.goto("/sponsorships/new");
    await page.waitForURL(/[?&]case=/, { timeout: 15_000 });
    const firstCaseId = new URL(page.url()).searchParams.get("case");
    expect(firstCaseId).toBeTruthy();

    // Navigating to /new again must redirect to the SAME case, not create a new one
    await page.goto("/sponsorships/new");
    await page.waitForURL(/[?&]case=/, { timeout: 15_000 });
    const secondCaseId = new URL(page.url()).searchParams.get("case");
    expect(secondCaseId).toBe(firstCaseId);                                         // ✓ no new draft
  });
});
