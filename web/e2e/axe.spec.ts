import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * This suite's zero-violations checks (REQ-A11Y-7) also directly exercise:
 *  - REQ-A11Y-1 (landmarks, single h1, heading order) via axe's
 *    landmark-one-main/region/heading-order rules, checked explicitly
 *    below too rather than only riding along on the generic axe ruleset.
 *  - REQ-A11Y-6 (color contrast) via axe's color-contrast rule - this is
 *    exactly what originally caught the Approve button's 3.29:1 failure.
 *  - REQ-STATE-4 (success view) - every page here renders its normal
 *    populated state.
 */
async function expectOneH1AndLandmarks(page: import("@playwright/test").Page) {
  await expect(page.locator("h1")).toHaveCount(1);
  // By role, not tag: the detail page's <article> has its own <header> for
  // the requester-name row, which is valid HTML5 but is NOT a "banner"
  // landmark (a <header> only gets that role when it isn't nested inside
  // article/aside/main/nav/section) - counting raw <header> tags would
  // wrongly flag that as a second landmark.
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
}

test.describe("REQ-A11Y-7: zero axe violations per page", () => {
  test("home / list page", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("h1");
    await expectOneH1AndLandmarks(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("new request page", async ({ page }) => {
    await page.goto("/requests/new");
    await page.waitForSelector("h1");
    await expectOneH1AndLandmarks(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("detail page", async ({ page }) => {
    await page.goto("/requests/1");
    await page.waitForSelector("h1");
    await expectOneH1AndLandmarks(page);
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
