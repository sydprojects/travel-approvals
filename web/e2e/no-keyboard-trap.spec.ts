import { test, expect, type Page } from "@playwright/test";

/**
 * Root cause of the flakiness this replaces (3 lines): a fixed 30-Tab
 * count doesn't match each page's actual number of focusable elements, so
 * focus sometimes wrapped around mid-loop and landed briefly on
 * document.body/html between cycles; the old code's "previous distinct"
 * tracking then sometimes compared the Shift+Tab assertion against that
 * body/html mark instead of a real element, failing intermittently.
 */

async function currentMark(page: Page): Promise<{ mark: string; tag: string }> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return { mark: "", tag: "" };
    if (!el.hasAttribute("data-e2e-mark")) {
      el.setAttribute("data-e2e-mark", Math.random().toString(36));
    }
    return { mark: el.getAttribute("data-e2e-mark")!, tag: el.tagName };
  });
}

type ForwardResult = {
  /** Distinct real-element destinations, in the order first visited. */
  order: string[];
  /**
   * Set when forward Tabbing wrapped back to an earlier destination
   * before hitting the cap - that earlier destination's mark, which is
   * where focus actually ends up (not order[order.length - 1]: the wrap
   * consumes one more real Tab press than the last *newly* recorded
   * entry accounts for).
   */
  wrappedTo: string | null;
};

/**
 * Tabs forward, recording only distinct real-element destinations:
 * document.body/html landings (the wrap-around artifact) are skipped, not
 * recorded and not treated as a stop condition; consecutive repeats of
 * the *same* element are tolerated (native <input type="date"> exposes
 * multiple internal segment stops on one element) and collapsed rather
 * than double-counted or mistaken for a wrap; a repeat of an *earlier*
 * distinct element is the real wrap signal and stops collection there,
 * recording which element it wrapped to. A sane cap bounds it in case
 * none of that ever triggers.
 */
async function collectDistinctFocusOrder(page: Page, maxTabs = 50): Promise<ForwardResult> {
  const order: string[] = [];
  const seen = new Set<string>();
  let previous: string | null = null;

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const { mark, tag } = await currentMark(page);

    if (tag === "BODY" || tag === "HTML") {
      previous = null;
      continue;
    }
    if (mark === previous) continue; // same element's next internal segment
    if (seen.has(mark)) return { order, wrappedTo: mark }; // genuine wrap

    seen.add(mark);
    order.push(mark);
    previous = mark;
  }

  return { order, wrappedTo: null };
}

test.describe("REQ-A11Y-2: no keyboard trap", () => {
  for (const { path, heading } of [
    { path: "/", heading: "Travel Approvals" },
    { path: "/requests/new", heading: "New travel request" },
    { path: "/requests/1", heading: "Travel request: Ana Torres" },
  ]) {
    test(`Tab keeps moving and Shift+Tab can move backward on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();

      const { order, wrappedTo } = await collectDistinctFocusOrder(page);
      expect(order.length, "Tab should reach multiple different elements before wrapping").toBeGreaterThan(2);

      // If we wrapped, focus is now AT the earlier element it wrapped to,
      // not at the last newly-recorded entry - the wrap itself is one
      // more real Tab press than that last recorded entry accounts for.
      const currentDestination = wrappedTo ?? order[order.length - 1];
      const previousDestination = wrappedTo ? order[order.length - 1] : order[order.length - 2];

      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Shift+Tab");
        const { mark, tag } = await currentMark(page);
        // Shift+Tab from the first tabbable element passes through
        // document.body too (the same wrap artifact in reverse) before
        // reaching the true last element - skip it, same as forward.
        if (tag === "BODY" || tag === "HTML") continue;
        if (mark !== currentDestination) {
          expect(mark, "Shift+Tab should return to the previous distinct destination").toBe(previousDestination);
          return;
        }
      }
      throw new Error(`Shift+Tab could not leave the final destination within 5 presses`);
    });
  }
});
