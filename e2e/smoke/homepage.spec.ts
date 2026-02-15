import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads and shows hero section", async ({ page }) => {
    // Hero heading should be visible
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toBeVisible();
  });

  test("shows featured resorts section", async ({ page }) => {
    // Look for featured listings or resorts section
    const featured = page.getByText(/featured|available|browse/i).first();
    await expect(featured).toBeVisible();
  });

  test("shows trust badges", async ({ page }) => {
    // Trust badges should be present
    await expect(page.getByText(/resorts/i).first()).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /rent/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /sign|log/i }).first()).toBeVisible();
  });

  test("footer shows build version", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/v\d+\.\d+/)).toBeVisible();
  });
});
