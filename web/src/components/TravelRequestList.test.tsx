import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { TravelRequestList } from "./TravelRequestList";
import type { TravelRequest } from "@/lib/types";

const items: TravelRequest[] = [
  {
    id: 1,
    requesterName: "Ana Torres",
    destination: "Buenos Aires, AR",
    startDate: "2026-10-06",
    endDate: "2026-10-09",
    reason: "Client kickoff meeting for the Q4 rollout.",
    status: "pending",
    createdAt: "2026-09-20T10:00:00.000Z",
  },
  {
    id: 2,
    requesterName: "Marco Bittner",
    destination: "Bogota, CO",
    startDate: "2026-09-20",
    endDate: "2026-09-22",
    reason: "Regional sales conference, booth staffing.",
    status: "approved",
    createdAt: "2026-09-15T09:30:00.000Z",
  },
];

describe("TravelRequestList", () => {
  it("REQ-LIST-1: renders one row per item", () => {
    render(<TravelRequestList items={items} />);
    expect(screen.getByText("Ana Torres")).toBeInTheDocument();
    expect(screen.getByText("Marco Bittner")).toBeInTheDocument();
  });

  it("REQ-LIST-2: shows status as visible text, not color alone", () => {
    render(<TravelRequestList items={items} />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/approved/i)).toBeInTheDocument();
  });

  it("REQ-LIST-3: exposes a landmark region with a heading", () => {
    render(<TravelRequestList items={items} />);
    expect(screen.getByRole("region", { name: /travel requests/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /travel requests/i })).toBeInTheDocument();
  });

  it("REQ-STATE-2: shows a distinct empty state for zero items", () => {
    render(<TravelRequestList items={[]} />);
    expect(screen.getByText(/no travel requests/i)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<TravelRequestList items={items} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
