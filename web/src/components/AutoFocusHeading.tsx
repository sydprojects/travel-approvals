"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  level?: 1 | 2;
};

// Module scope on purpose: persists across client-side route transitions
// within one session, but resets on a hard page load (new JS context).
let hasNavigatedOnce = false;

/**
 * REQ-A11Y-4: moves focus to the page's heading after a client-side route
 * change, so keyboard and screen-reader users land somewhere meaningful
 * instead of on a focus target that no longer exists. Deliberately does
 * NOT fire on the very first hard page load - the browser already
 * establishes initial focus then, and yanking it away (especially while
 * hydration is still settling) can override a user who started
 * interacting immediately, which is exactly what happened here: an
 * earlier version fired unconditionally and hijacked focus mid-keyboard-
 * navigation in the Playwright e2e run. Separate from the TODO(eduardo)
 * decision 1 stub, which is specifically about what happens right after
 * create-submit.
 */
export function AutoFocusHeading({ children, level = 1 }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  // Guards against React Strict Mode (on by default in Next.js dev), which
  // runs each effect twice per real mount to surface effect bugs. useRef
  // survives that double-invoke (only the effect re-runs, not the
  // component instance), so this correctly no-ops the second call instead
  // of treating it as a second real navigation.
  const didRunForThisMount = useRef(false);

  useEffect(() => {
    if (didRunForThisMount.current) return;
    didRunForThisMount.current = true;

    if (hasNavigatedOnce) {
      ref.current?.focus();
    }
    hasNavigatedOnce = true;
  }, []);

  const Tag = level === 1 ? "h1" : "h2";
  return (
    <Tag ref={ref} tabIndex={-1}>
      {children}
    </Tag>
  );
}
