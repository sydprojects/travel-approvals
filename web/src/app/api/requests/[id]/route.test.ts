import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/platformApi", () => ({
  getRequest: vi.fn(),
  decideRequest: vi.fn(),
}));

import { getRequest, decideRequest } from "@/lib/platformApi";
import { GET, PATCH } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
});

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/requests/1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/requests/[id]", () => {
  it("REQ-VIEW-1: returns the request", async () => {
    vi.mocked(getRequest).mockResolvedValue({
      ok: true,
      status: 200,
      data: { id: 1, requesterName: "Ana", destination: "X", startDate: "2026-01-01", endDate: "2026-01-02", reason: "reason here for testing", status: "pending", createdAt: "2026-01-01T00:00:00.000Z" },
    });
    const res = await GET(new NextRequest("http://localhost/api/requests/1"), ctx("1"));
    expect(res.status).toBe(200);
  });

  it("REQ-VIEW-2: maps a not-found downstream response to a clear 404", async () => {
    vi.mocked(getRequest).mockResolvedValue({ ok: false, status: 404, body: { error: "not found" } });
    const res = await GET(new NextRequest("http://localhost/api/requests/999"), ctx("999"));
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/requests/[id]", () => {
  it("REQ-BFF-1: rejects an invalid status before calling the platform service", async () => {
    const res = await PATCH(patchRequest({ status: "archived" }), ctx("1"));
    expect(res.status).toBe(400);
    expect(decideRequest).not.toHaveBeenCalled();
  });

  it("REQ-APPROVE-3: forwards a valid decision and returns the updated request", async () => {
    vi.mocked(decideRequest).mockResolvedValue({
      ok: true,
      status: 200,
      data: { id: 1, requesterName: "Ana", destination: "X", startDate: "2026-01-01", endDate: "2026-01-02", reason: "reason here for testing", status: "approved", createdAt: "2026-01-01T00:00:00.000Z" },
    });
    const res = await PATCH(patchRequest({ status: "approved" }), ctx("1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("approved");
  });

  it("maps a terminal-state conflict from the platform service to a 409", async () => {
    vi.mocked(decideRequest).mockResolvedValue({
      ok: false,
      status: 409,
      body: { error: "Request is already approved and cannot be changed." },
    });
    const res = await PATCH(patchRequest({ status: "rejected" }), ctx("1"));
    expect(res.status).toBe(409);
  });
});
