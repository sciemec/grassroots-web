import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero headline", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /grassroots sport/i })).toBeVisible();
  });

  test("shows 10 sports in the grid", async ({ page }) => {
    const sports = ["Football", "Rugby", "Netball", "Basketball", "Cricket",
                    "Athletics", "Swimming", "Tennis", "Volleyball", "Hockey"];
    for (const sport of sports) {
      await expect(page.getByText(sport).first()).toBeVisible();
    }
  });

  test("register links point to role-specific pages", async ({ page }) => {
    // Check player register link
    const playerLink = page.getByRole("link", { name: /register.*player/i }).first();
    if (await playerLink.count() > 0) {
      await expect(playerLink).toHaveAttribute("href", "/register/player");
    }
  });

  test("footer has Terms and Privacy links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /terms/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy/i })).toBeVisible();
  });

  test("login link is present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign in|log in/i }).first()).toBeVisible();
  });
});

test.describe("Terms of Service", () => {
  test("renders all major sections", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
    await expect(page.getByText("1. Who We Are")).toBeVisible();
    await expect(page.getByText("9. Child Safeguarding")).toBeVisible();
    await expect(page.getByText("14. Contact Us")).toBeVisible();
  });

  test("back to home link works", async ({ page }) => {
    await page.goto("/terms");
    await page.getByRole("link", { name: /back to home/i }).first().click();
    await expect(page).toHaveURL("/");
  });

  test("links to privacy policy", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("link", { name: /privacy policy/i })).toBeVisible();
  });
});

test.describe("Privacy Policy", () => {
  test("renders all major sections", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await expect(page.getByText("1. Who This Policy Applies To")).toBeVisible();
    await expect(page.getByText("6. Children")).toBeVisible();
    await expect(page.getByText("9. Your Rights")).toBeVisible();
  });
});

test.describe("404 page", () => {
  test("shows not found for unknown route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-xyz");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
  });
});
