import { test, expect } from "@playwright/test";

/**
 * The brief requires every async view to be responsive. This checks the
 * concrete, automatable part of that: no horizontal overflow at a common
 * phone width, on every real page - not a visual/manual "looks fine"
 * judgment.
 */
test.use({ viewport: { width: 375, height: 667 } });

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

test.describe("Responsive at 375px viewport (phone width)", () => {
  test("home / list page", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("h1");
    await expectNoHorizontalOverflow(page);
  });

  test("new request page", async ({ page }) => {
    await page.goto("/requests/new");
    await page.waitForSelector("h1");
    await expectNoHorizontalOverflow(page);

    // The start/end date row stacks to one column below 480px so two
    // native date inputs never get squeezed into an unusably narrow track.
    const row = page.locator("form > div").filter({ has: page.getByLabel(/start date/i) });
    const columns = await row.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(1);
  });

  test("detail page", async ({ page }) => {
    await page.goto("/requests/1");
    await page.waitForSelector("h1");
    await expectNoHorizontalOverflow(page);
  });

  test("create form with validation errors visible", async ({ page }) => {
    await page.goto("/requests/new");
    await page.getByRole("button", { name: /submit/i }).click();
    await page.waitForSelector('[aria-describedby]');
    await expectNoHorizontalOverflow(page);
  });
});
