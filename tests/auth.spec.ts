import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders all three portal tabs", async ({ page }) => {
    await expect(page.getByText("Player")).toBeVisible();
    await expect(page.getByText("Coach / Scout")).toBeVisible();
    await expect(page.getByText("Fan")).toBeVisible();
  });

  test("switches gradient on portal tab click", async ({ page }) => {
    await page.getByText("Coach / Scout").click();
    await expect(page.getByText("Professional Portal")).toBeVisible();

    await page.getByText("Fan").click();
    await expect(page.getByText("Fan Portal")).toBeVisible();
  });

  test("shows validation error on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/email and password are required/i)).toBeVisible();
  });

  test("password eye toggle works", async ({ page }) => {
    const pwInput = page.locator('input[type="password"]');
    await expect(pwInput).toBeVisible();

    // Click the eye icon
    await page.locator('[aria-label="Show password"]').click();
    await expect(page.locator('input[type="text"][placeholder="••••••••"]')).toBeVisible();

    // Toggle back
    await page.locator('[aria-label="Hide password"]').click();
    await expect(pwInput).toBeVisible();
  });

  test("forgot password link navigates correctly", async ({ page }) => {
    await page.getByText("Forgot password?").click();
    await expect(page).toHaveURL("/forgot-password");
  });

  test("create account links navigate to registration", async ({ page }) => {
    await page.getByRole("link", { name: /🏃 Player/i }).click();
    await expect(page).toHaveURL("/register/player");
  });
});

test.describe("Registration role selector", () => {
  test("shows all 4 role cards", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("Player")).toBeVisible();
    await expect(page.getByText("Coach")).toBeVisible();
    await expect(page.getByText("Scout")).toBeVisible();
    await expect(page.getByText("Fan")).toBeVisible();
  });
});

test.describe("Forgot password page", () => {
  test("renders email input and submit button", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });
});

test.describe("Email verification page", () => {
  test("renders check inbox message", async ({ page }) => {
    await page.goto("/verify-email?email=test%40example.com");
    await expect(page.getByText("Check your inbox")).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /resend/i })).toBeVisible();
  });
});
