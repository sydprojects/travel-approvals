import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Loading from "./loading";

describe("Loading (request detail)", () => {
  it("REQ-STATE-1: shows a visible, announced loading indicator", () => {
    render(<Loading />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/loading/i);
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
