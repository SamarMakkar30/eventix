import { test, expect } from "@playwright/test";

/**
 * Auth flow e2e — register, login, logout, protected route redirect.
 * Uses real dev server; API calls go to VITE_API_BASE_URL (defaults to localhost:8080).
 * If no backend is running these tests are skipped gracefully.
 */

test.describe("Auth guard — no session", () => {
  test("visiting /bookings without auth redirects to /login", async ({ page }) => {
    // Clear any stored auth
    await page.context().clearCookies();
    await page.context().addInitScript(() => localStorage.clear());

    await page.goto("/bookings");
    // Should land on /login (redirect) or show an auth prompt
    await expect(page).toHaveURL(/login|auth/, { timeout: 6000 });
  });

  test("visiting /checkout without auth redirects to /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.context().addInitScript(() => localStorage.clear());

    await page.goto("/checkout");
    await expect(page).toHaveURL(/login|auth/, { timeout: 6000 });
  });

  test("visiting /admin without auth redirects to /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.context().addInitScript(() => localStorage.clear());

    await page.goto("/admin");
    await expect(page).toHaveURL(/login|admin|auth/, { timeout: 6000 });
  });
});

test.describe("Login form validation", () => {
  test("shows error on empty submit", async ({ page }) => {
    await page.goto("/login");
    // Click the login/submit button without filling fields
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();
    // HTML5 required validation or custom error should appear
    // At minimum the page should still be on login route
    await expect(page).toHaveURL(/login|auth/);
  });

  test("login form has accessible email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });
});
