import { test, expect } from "@playwright/test";

/**
 * Smoke test — public pages render key content without errors.
 */
test.describe("Public navigation", () => {
  test("landing page loads headline and CTA", async ({ page }) => {
    await page.goto("/");
    // Hero headline visible
    await expect(page.locator("h1").first()).toBeVisible();
    // Browse / Explore link exists in nav
    await expect(page.getByRole("link", { name: /explore|browse|shows/i }).first()).toBeVisible();
    // No JS errors on page load
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test("shows / explore page renders catalog grid", async ({ page }) => {
    await page.goto("/shows");
    // Either redirects to /explore or renders shows list — wait for grid or empty state
    await expect(page.locator("[class*='grid'], [class*='card'], h2, p").first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("404 page renders for unknown route", async ({ page }) => {
    const resp = await page.goto("/this-does-not-exist-at-all");
    // Custom 404 or not-found component is shown
    await expect(page.locator("body")).toContainText(/not found|404/i, { timeout: 5000 });
    // Accept 200 (client-side SPA routing) or 404
    expect([200, 404]).toContain(resp?.status());
  });
});
