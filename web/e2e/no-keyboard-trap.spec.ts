import { test, expect, type Page } from "@playwright/test";

/**
 * Marks actual elements rather than comparing .id: plain buttons and
 * links can have empty ids but are still different focus destinations.
 */
async function focusedElementMark(page: Page, mark: string) {
  return page.evaluate((value) => {
    const active = document.activeElement;
    if (!active) throw new Error("No focused element");
    if (!active.hasAttribute("data-e2e-marked")) {
      active.setAttribute("data-e2e-marked", value);
    }
    return active.getAttribute("data-e2e-marked")!;
  }, mark);
}

/**
 * Native date inputs have multiple segment stops on the same element.
 * Allow those stops, but fail if five consecutive Tabs cannot leave it.
 * Revisiting elements after wrapping around the page is expected.
 */
async function expectNoKeyboardTrap(page: Page, maxTabs = 30) {
  let previous = await focusedElementMark(page, "start");
  let previousDistinct = previous;
  let repeated = 0;
  const visited = new Set<string>();

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const current = await focusedElementMark(page, `tab-${i}`);
    visited.add(current);
    repeated = current === previous ? repeated + 1 : 0;
    expect(repeated, `Focus stuck on ${current} after Tab ${i + 1}`).toBeLessThan(5);
    if (current !== previous) previousDistinct = previous;
    previous = current;
  }

  expect(visited.size, "Tab should reach multiple different elements").toBeGreaterThan(2);

  // Reverse from the actual final destination, without programmatic focus
  // or mouse input. Date segments need the same allowance in reverse.
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Shift+Tab");
    const current = await focusedElementMark(page, `reverse-${i}`);
    if (current !== previous) {
      expect(current, "Shift+Tab should return to the previous focus destination").toBe(previousDistinct);
      return;
    }
  }
  throw new Error(`Shift+Tab could not leave ${previous} within 5 presses`);
}

test.describe("REQ-A11Y-2: no keyboard trap", () => {
  for (const { path, heading } of [
    { path: "/", heading: "Travel Approvals" },
    { path: "/requests/new", heading: "New travel request" },
    { path: "/requests/1", heading: "Travel request: Ana Torres" },
  ]) {
    test(`Tab keeps moving and Shift+Tab can move backward on ${path}`, async ({ page }) => {
      await page.goto(path);
      // Fresh loads do not auto-focus the heading; wait for its content.
      await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();

      await expectNoKeyboardTrap(page);
    });
  }
});
