import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("REQ-A11Y-7: zero axe violations per page", () => {
  test("home / list page", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("h1");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("new request page", async ({ page }) => {
    await page.goto("/requests/new");
    await page.waitForSelector("h1");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("detail page", async ({ page }) => {
    await page.goto("/requests/1");
    await page.waitForSelector("h1");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("create form with validation errors visible", async ({ page }) => {
    await page.goto("/requests/new");
    await page.getByRole("button", { name: /submit/i }).click();
    await page.waitForSelector('[aria-describedby]');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
