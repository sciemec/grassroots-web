/**
 * Playwright config for running E2E tests against the live site.
 * Usage:
 *   BASE_URL=https://grassrootssports.live \
 *   TEST_EMAIL=player@grassrootssports.live \
 *   TEST_PASSWORD=<password> \
 *   npx playwright test --config=playwright.live.config.ts --project=chromium
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: process.env.BASE_URL ?? "https://grassrootssports.live",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // No webServer — tests run against the already-deployed live site
});
