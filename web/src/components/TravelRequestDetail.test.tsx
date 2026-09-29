import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { TravelRequestDetail } from "./TravelRequestDetail";
import type { TravelRequest } from "@/lib/types";

const pending: TravelRequest = {
  id: 1,
  requesterName: "Ana Torres",
  destination: "Buenos Aires, AR",
  startDate: "2026-10-06",
  endDate: "2026-10-09",
  reason: "Client kickoff meeting for the Q4 rollout.",
  status: "pending",
  createdAt: "2026-09-20T10:00:00.000Z",
};

const approved: TravelRequest = {
  ...pending,
  status: "approved",
  decisionNote: "Approved, standard per-diem applies.",
};

describe("TravelRequestDetail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("REQ-VIEW-1: shows all fields, including decisionNote when present", () => {
    render(<TravelRequestDetail item={approved} onDecided={() => {}} />);
    expect(screen.getByText("Ana Torres")).toBeInTheDocument();
    expect(screen.getByText(/standard per-diem applies/i)).toBeInTheDocument();
  });

  it("REQ-APPROVE-1: a pending request shows Approve/Reject", () => {
    render(<TravelRequestDetail item={pending} onDecided={() => {}} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("REQ-APPROVE-1: an already-decided request shows neither control", () => {
    render(<TravelRequestDetail item={approved} onDecided={() => {}} />);
    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
  });

  it("REQ-APPROVE-1/3: after a successful decision, the same mounted instance updates its own badge and hides the controls", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...pending, status: "approved" }),
    } as Response);

    const user = userEvent.setup();
    render(<TravelRequestDetail item={pending} onDecided={() => {}} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
    });
    expect(screen.getAllByText(/approved/i).length).toBeGreaterThan(0);
  });

  it("REQ-APPROVE-2: Approve is reachable and activatable by keyboard alone", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...pending, status: "approved" }),
    } as Response);

    render(<TravelRequestDetail item={pending} onDecided={() => {}} />);
    await user.tab();
    const approveButton = screen.getByRole("button", { name: /approve/i });
    expect(approveButton).toHaveFocus();
    await user.keyboard("{Enter}");

    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });

  it("REQ-APPROVE-3: announces the outcome via aria-live without a page reload", async () => {
    const onDecided = vi.fn();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...pending, status: "approved" }),
    } as Response);

    const user = userEvent.setup();
    render(<TravelRequestDetail item={pending} onDecided={onDecided} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      const live = document.querySelector("[aria-live]");
      expect(live?.textContent).toMatch(/approved/i);
    });
    expect(onDecided).toHaveBeenCalledWith(expect.objectContaining({ status: "approved" }));
  });

  it("REQ-VIEW-2: shows a not-found state when item is null", () => {
    render(<TravelRequestDetail item={null} onDecided={() => {}} />);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<TravelRequestDetail item={pending} onDecided={() => {}} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
