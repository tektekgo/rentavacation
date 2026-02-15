import { test } from "@playwright/test";
import percySnapshot from "@percy/playwright";

test.describe("Visual Regression - Core Pages", () => {
  test("Homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await percySnapshot(page, "Homepage");
  });

  test("Rentals page", async ({ page }) => {
    await page.goto("/rentals");
    await page.waitForLoadState("networkidle");
    await percySnapshot(page, "Rentals");
  });

  test("Login page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await percySnapshot(page, "Login");
  });

  test("Signup page", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    await percySnapshot(page, "Signup");
  });
});
