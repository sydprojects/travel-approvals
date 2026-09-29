"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  level?: 1 | 2;
};

/**
 * REQ-A11Y-4: moves focus to the page's heading on mount, so keyboard and
 * screen-reader users land somewhere meaningful after a route change
 * instead of on a focus target that no longer exists. This is a general
 * route-change rule, separate from the TODO(eduardo) decision 1 stub,
 * which is specifically about what happens right after create-submit.
 */
export function AutoFocusHeading({ children, level = 1 }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const Tag = level === 1 ? "h1" : "h2";
  return (
    <Tag ref={ref} tabIndex={-1}>
      {children}
    </Tag>
  );
}
