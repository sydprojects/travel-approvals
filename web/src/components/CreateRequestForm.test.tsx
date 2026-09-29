import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { CreateRequestForm } from "./CreateRequestForm";

describe("CreateRequestForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("REQ-CREATE-1: every field has a real label", () => {
    render(<CreateRequestForm onCreated={() => {}} />);
    expect(screen.getByLabelText(/requester/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
  });

  it("REQ-CREATE-2: an invalid submit shows a field error linked via aria-describedby", async () => {
    const user = userEvent.setup();
    render(<CreateRequestForm onCreated={() => {}} />);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    const reasonInput = screen.getByLabelText(/reason/i);
    const describedBy = reasonInput.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).not.toBeNull();
    expect(errorEl?.textContent).toMatch(/reason/i);
  });

  it("REQ-CREATE-4: submit is disabled and labelled busy while in flight, re-enabled after success", async () => {
    let resolveFetch: (v: Response) => void;
    const pending = new Promise<Response>((r) => (resolveFetch = r));
    vi.spyOn(global, "fetch").mockReturnValue(pending as unknown as Promise<Response>);

    const user = userEvent.setup();
    render(<CreateRequestForm onCreated={() => {}} />);

    await user.type(screen.getByLabelText(/requester/i), "Jamie Lee");
    await user.type(screen.getByLabelText(/destination/i), "Lima, PE");
    await user.type(screen.getByLabelText(/start date/i), "2026-12-01");
    await user.type(screen.getByLabelText(/end date/i), "2026-12-05");
    await user.type(screen.getByLabelText(/reason/i), "Annual supplier review meeting on site.");

    const button = screen.getByRole("button", { name: /submit/i });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/submitting/i);

    resolveFetch!({
      ok: true,
      status: 201,
      json: async () => ({ id: 4, status: "pending" }),
    } as Response);

    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("REQ-CREATE-4: submit re-enables after a failed request too", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid input." }),
    } as Response);

    const user = userEvent.setup();
    render(<CreateRequestForm onCreated={() => {}} />);

    await user.type(screen.getByLabelText(/requester/i), "Jamie Lee");
    await user.type(screen.getByLabelText(/destination/i), "Lima, PE");
    await user.type(screen.getByLabelText(/start date/i), "2026-12-01");
    await user.type(screen.getByLabelText(/end date/i), "2026-12-05");
    await user.type(screen.getByLabelText(/reason/i), "Annual supplier review meeting on site.");

    const button = screen.getByRole("button", { name: /submit/i });
    await user.click(button);

    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("REQ-A11Y-5: announces the result via an aria-live region", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid input." }),
    } as Response);

    const user = userEvent.setup();
    render(<CreateRequestForm onCreated={() => {}} />);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      const live = document.querySelector('[aria-live]');
      expect(live?.textContent).toBeTruthy();
    });
  });

  it("has no axe violations", async () => {
    const { container } = render(<CreateRequestForm onCreated={() => {}} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
