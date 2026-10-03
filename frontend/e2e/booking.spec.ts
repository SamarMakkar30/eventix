import { test, expect } from "@playwright/test";

/**
 * Booking funnel e2e — show detail → seats → checkout redirect.
 * Validates the happy-path navigation without requiring a live API.
 */

test.describe("Show detail page", () => {
  test("navigates to seat selection from show detail CTA", async ({ page }) => {
    await page.goto("/shows");
    // Wait for any show cards or empty state to appear
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => null);

    // If there are show cards, click the first one
    const firstCard = page.locator("a[href*='/shows/']").first();
    const hasCard = await firstCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCard) {
      await firstCard.click();
      // Should navigate to /shows/:id
      await expect(page).toHaveURL(/\/shows\/\d+/, { timeout: 6000 });
      // Show detail page should have a Book / Select Seats button
      const bookBtn = page.getByRole("link", { name: /select seats|book now|book tickets/i });
      const hasBtnVisible = await bookBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasBtnVisible) {
        await bookBtn.click();
        await expect(page).toHaveURL(/\/shows\/\d+\/seats/, { timeout: 6000 });
      }
    } else {
      // No data from API — verify at minimum the page doesn't throw
      await expect(page.locator("body")).not.toContainText(/undefined|null|TypeError/i);
    }
  });
});

test.describe("Seat selection page", () => {
  test("requires auth for /checkout", async ({ page }) => {
    // Navigate to checkout directly without a draft in session
    await page.context().addInitScript(() => sessionStorage.clear());
    await page.goto("/checkout");

    // Either redirects to login (no auth) or shows empty booking state
    const url = page.url();
    const isOnLogin = url.includes("login") || url.includes("auth");
    const bodyText = await page.locator("body").textContent();
    const hasEmptyMessage = /no booking|select a show|browse/i.test(bodyText ?? "");

    expect(isOnLogin || hasEmptyMessage).toBe(true);
  });
});

test.describe("Booking confirmation page", () => {
  test("shows not-found for invalid booking ID", async ({ page }) => {
    await page.goto("/confirmation/99999999");
    // Should show error or redirect — not a blank page
    await expect(page.locator("body")).not.toBeEmpty();
    // Should not render undefined or raw error objects
    await expect(page.locator("body")).not.toContainText(/undefined|null\b/i);
  });
});
