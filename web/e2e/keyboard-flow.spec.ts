import { test, expect, type Page } from "@playwright/test";

/**
 * Presses Tab until focus actually moves off the current element, up to a
 * bound. Needed because native <input type="date"> exposes per-segment tab
 * stops (month/day/year) that don't reliably clear after typing a full
 * value in every browser build - asserting "reachable within a few tabs"
 * is the real requirement (REQ-A11Y-2: keyboard-operable), not "reachable
 * in exactly N tabs", which is an implementation detail of date-input
 * segment handling, not of our app.
 */
async function tabAwayFrom(page: Page, maxTabs = 5) {
  // Marks the currently focused element rather than comparing .id - several
  // focused elements here (headings, plain <button>s) have no id, so two
  // empty ids would look indistinguishable from "focus didn't move".
  await page.evaluate(() => document.activeElement?.setAttribute("data-e2e-marked", "1"));
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const stillMarked = await page.evaluate(
      () => document.activeElement?.getAttribute("data-e2e-marked") === "1"
    );
    if (!stillMarked) return;
  }
  throw new Error(`Focus did not move within ${maxTabs} tabs`);
}

/**
 * Tabs (bounded) until the focused element's own text matches, rather than
 * assuming a fixed tab count - how many tabs it takes depends on whether
 * focus starts at the header or already at an auto-focused in-page
 * heading (see AutoFocusHeading), which varies by navigation path.
 */
async function tabUntilTextMatches(page: Page, pattern: RegExp, maxTabs = 8) {
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const text = await page.evaluate(() => document.activeElement?.textContent ?? "");
    if (pattern.test(text)) return;
  }
  throw new Error(`No focused element matched ${pattern} within ${maxTabs} tabs`);
}

/**
 * Waits for AutoFocusHeading's effect to actually land focus on the page's
 * h1 before we start tabbing relative to it. Without this, tabAwayFrom can
 * mark <body> (if the effect hasn't run yet) instead of the heading,
 * producing a flaky first Tab destination.
 */
async function waitForHeadingFocus(page: Page) {
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("H1");
}

test("keyboard-only: create a request, then approve it (REQ-A11Y-2)", async ({ page }) => {
  await page.goto("/");

  // Reach "New request" purely by keyboard from a fresh page load.
  await page.keyboard.press("Tab"); // brand link
  await page.keyboard.press("Tab"); // "New request" nav link
  await expect(page.getByRole("link", { name: /new request/i })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/requests\/new/);
  await waitForHeadingFocus(page);

  // AutoFocusHeading has focused the h1; Tab moves into the form.
  await tabAwayFrom(page); // -> requester name
  await expect(page.getByLabel(/requester/i)).toBeFocused();
  await page.keyboard.type("Jamie Lee");

  await tabAwayFrom(page); // -> destination
  await expect(page.getByLabel(/destination/i)).toBeFocused();
  await page.keyboard.type("Lima, PE");

  await tabAwayFrom(page); // -> start date
  await expect(page.getByLabel(/start date/i)).toBeFocused();
  await page.keyboard.type("12012026");

  await tabAwayFrom(page); // -> end date (may take a few tabs past date segments)
  await expect(page.getByLabel(/end date/i)).toBeFocused();
  await page.keyboard.type("12052026");

  await tabAwayFrom(page); // -> reason
  await expect(page.getByLabel(/reason/i)).toBeFocused();
  await page.keyboard.type("Annual supplier review meeting on site.");

  await tabAwayFrom(page); // -> submit
  await expect(page.getByRole("button", { name: /submit/i })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL("/");
  await waitForHeadingFocus(page);

  // TODO(eduardo) - decision 1 (docs/requirements.md, REQ-CREATE-5) is not
  // implemented: the stub navigates home with only generic route focus, so
  // focus lands on the home page's own heading, not on anything confirming
  // *this* request. This soft assertion documents that gap without blocking
  // the rest of the flow below (create -> approve) from being verified.
  const activeElementText = await page.evaluate(() => document.activeElement?.textContent ?? "");
  expect.soft(activeElementText).toMatch(/jamie lee/i);

  // Continue keyboard-only: the new request sorts first (newest-first);
  // open it and approve it, still without touching the mouse. Starting
  // from the already-focused home heading, one tab reaches the first item.
  await tabUntilTextMatches(page, /jamie lee/i);
  await expect(page.getByRole("link").filter({ hasText: "Jamie Lee" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/requests\/\d+/);
  await waitForHeadingFocus(page);

  await tabAwayFrom(page); // -> Approve button
  await expect(page.getByRole("button", { name: /approve/i })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator('p[aria-live="polite"]')).toContainText(/approved/i);
  await expect(page.getByRole("button", { name: /approve/i })).toHaveCount(0);
});
