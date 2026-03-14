import { test, expect } from "@playwright/test";

test.describe("Player registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register/player");
  });

  test("shows 5-step wizard on load", async ({ page }) => {
    await expect(page.getByText("Player Registration")).toBeVisible();
    await expect(page.getByText("Personal")).toBeVisible();
    await expect(page.getByText("Account")).toBeVisible();
  });

  test("step 1 validates required fields", async ({ page }) => {
    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test("fills step 1 and advances", async ({ page }) => {
    await page.locator('input[placeholder="Tinashe Moyo"]').fill("Test Player");
    // Select DOB
    await page.locator('select').nth(0).selectOption("15"); // day
    await page.locator('select').nth(1).selectOption("06"); // month (June)
    await page.locator('select').nth(2).selectOption("2010"); // year → U17
    // Select sex
    await page.getByRole("button", { name: "Male" }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByText("Create your account")).toBeVisible();
  });

  test("back button returns to previous step", async ({ page }) => {
    // Fill step 1 first
    await page.locator('input[placeholder="Tinashe Moyo"]').fill("Test Player");
    await page.locator('select').nth(0).selectOption("15");
    await page.locator('select').nth(1).selectOption("06");
    await page.locator('select').nth(2).selectOption("2010");
    await page.getByRole("button", { name: "Male" }).click();
    await page.getByRole("button", { name: /next/i }).click();
    // Now go back
    await page.getByRole("button", { name: /back/i }).click();
    await expect(page.getByText("Personal information")).toBeVisible();
  });
});

test.describe("Coach registration", () => {
  test("renders 4-step blue-themed form", async ({ page }) => {
    await page.goto("/register/coach");
    await expect(page.getByText("Coach Registration")).toBeVisible();
    await expect(page.getByText("Personal")).toBeVisible();
  });
});

test.describe("Scout registration", () => {
  test("renders 4-step purple-themed form with ZIFA notice", async ({ page }) => {
    await page.goto("/register/scout");
    await expect(page.getByText("Scout Registration")).toBeVisible();
    await expect(page.getByText(/24.*hour.*review|review.*24/i)).toBeVisible();
  });
});

test.describe("Fan registration", () => {
  test("renders 3-step amber-themed form", async ({ page }) => {
    await page.goto("/register/fan");
    await expect(page.getByText("Fan Registration")).toBeVisible();
    await expect(page.getByText("Discover")).toBeVisible();
  });

  test("shows all 10 sports in the sport picker", async ({ page }) => {
    await page.goto("/register/fan");
    const sports = ["Football", "Rugby", "Netball", "Basketball", "Cricket",
                    "Athletics", "Swimming", "Tennis", "Volleyball", "Hockey"];
    for (const sport of sports) {
      await expect(page.getByText(sport)).toBeVisible();
    }
  });
});
