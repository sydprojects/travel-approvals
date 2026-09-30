import { test, expect, type Locator } from "@playwright/test";

/**
 * REQ-A11Y-3: every focusable interactive control must have a visible
 * focus indicator, not `outline: none` with nothing replacing it. Checks
 * the actual computed style after keyboard focus, in a real browser -
 * this was previously listed in docs/requirements.md as "manual check"
 * only and never actually automated or performed.
 */
async function hasVisibleFocusRing(locator: Locator) {
  await locator.focus();
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    const hasOutline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    const hasBoxShadow = style.boxShadow !== "none" && style.boxShadow !== "";
    return hasOutline || hasBoxShadow;
  });
}

test.describe("REQ-A11Y-3: visible focus indicator on real interactive controls", () => {
  test("header nav links", async ({ page }) => {
    await page.goto("/");
    expect(await hasVisibleFocusRing(page.getByRole("link", { name: /travel approvals/i }))).toBe(true);
    expect(await hasVisibleFocusRing(page.getByRole("link", { name: /new request/i }))).toBe(true);
  });

  test("request list item link", async ({ page }) => {
    await page.goto("/");
    const firstLink = page.getByRole("link").filter({ hasText: "Ana Torres" }).first();
    expect(await hasVisibleFocusRing(firstLink)).toBe(true);
  });

  test("create form inputs and submit button", async ({ page }) => {
    await page.goto("/requests/new");
    expect(await hasVisibleFocusRing(page.getByLabel(/requester/i))).toBe(true);
    expect(await hasVisibleFocusRing(page.getByLabel(/reason/i))).toBe(true);
    expect(await hasVisibleFocusRing(page.getByRole("button", { name: /submit/i }))).toBe(true);
  });

  test("approve/reject buttons on a pending request", async ({ page }) => {
    await page.goto("/requests/1");
    expect(await hasVisibleFocusRing(page.getByRole("button", { name: /approve/i }))).toBe(true);
    expect(await hasVisibleFocusRing(page.getByRole("button", { name: /reject/i }))).toBe(true);
  });
});
