/**
 * /account/cases page — status rendering test
 *
 * Mocks GET /sponsorships/mine with one case per status.
 * Asserts no crash and all 8 cases appear.
 *
 * Run:
 *   npx playwright test account-cases --project=chromium --headed
 */
import { test, expect, type Page } from "@playwright/test";

const BASE_EMAIL = process.env.TEST_EMAIL ?? "player@grassrootssports.live";

async function login(page: Page) {
  if (!process.env.TEST_PASSWORD) throw new Error("TEST_PASSWORD env var required");
  await page.goto("/login");
  await page.locator('input[autocomplete="username"]').fill(BASE_EMAIL);
  await page.locator('input[autocomplete="current-password"]').fill(process.env.TEST_PASSWORD);
  await page.locator("#login-submit-btn").click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
}

const ALL_STATUSES = [
  "draft",
  "pending_vouch",
  "in_review",
  "live",
  "paused",
  "closed",
  "rejected",
  "funded",
] as const;

function makeCases() {
  return ALL_STATUSES.map((status, i) => ({
    id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
    title: `Test Case ${status}`,
    category: "kit_and_equipment",
    sport: "football",
    status,
    target_cents: 50000,
    story_short: null,
    deadline_at: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    wizard_step: 1,
  }));
}

test.describe("/account/cases — all statuses render", () => {
  test("one case per status: no crash, all titles visible", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    // Mock the API — intercept before navigation
    await page.route("**/sponsorships/mine", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: makeCases() }),
      });
    });

    await page.goto("/account/cases");

    // Page must not show an error banner
    await expect(page.locator("text=Could not load your cases")).not.toBeVisible({ timeout: 10_000 });

    // All 8 case titles must be visible
    for (const status of ALL_STATUSES) {
      await expect(page.getByText(`Test Case ${status}`)).toBeVisible({ timeout: 10_000 });
    }

    // Status labels visible
    await expect(page.getByText("Draft")).toBeVisible();
    await expect(page.getByText("Awaiting vouch")).toBeVisible();
    await expect(page.getByText("Under GRS review")).toBeVisible();
    await expect(page.getByText("Live")).toBeVisible();
    await expect(page.getByText("Paused")).toBeVisible();
    await expect(page.getByText("Closed")).toBeVisible();
    await expect(page.getByText("Not approved")).toBeVisible();
    await expect(page.getByText("Funded")).toBeVisible();

    // "Introductions" link appears only for live case
    const introLinks = page.getByRole("link", { name: "Introductions" });
    await expect(introLinks).toHaveCount(1);

    // draft shows Continue editing, not View Case
    await expect(page.getByRole("link", { name: "Continue editing" })).toBeVisible();

    // pending_vouch shows "Request / check vouch"
    await expect(page.getByRole("link", { name: /Request \/ check vouch/i })).toBeVisible();

    // "New Case" header button links to ?new=1
    const newCaseLink = page.getByRole("link", { name: "New Case" });
    await expect(newCaseLink).toHaveAttribute("href", "/sponsorships/new?new=1");
  });
});
