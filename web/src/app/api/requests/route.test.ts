import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { MESSAGES } from "@/lib/messages";

vi.mock("@/lib/platformApi", () => ({
  listRequests: vi.fn(),
  createRequest: vi.fn(),
}));

import { listRequests, createRequest } from "@/lib/platformApi";
import { GET, POST } from "./route";

const validPayload = {
  requesterName: "Jamie Lee",
  destination: "Lima, PE",
  startDate: "2026-12-01",
  endDate: "2026-12-05",
  reason: "Annual supplier review meeting on site.",
};

beforeEach(() => {
  vi.resetAllMocks();
});

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/requests", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/requests", () => {
  it("REQ-LIST-1: returns items from the platform service", async () => {
    vi.mocked(listRequests).mockResolvedValue({
      ok: true,
      status: 200,
      data: { items: [] },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toEqual([]);
  });

  it("REQ-STATE-3 / REQ-BFF-3: maps a downstream failure to a mapped 5xx, never a crash", async () => {
    vi.mocked(listRequests).mockResolvedValue({
      ok: false,
      status: 500,
      body: { stack: "leaked internal trace" },
    });
    const res = await GET();
    expect(res.status).toBeGreaterThanOrEqual(500);
    const json = await res.json();
    expect(JSON.stringify(json)).not.toContain("leaked internal trace");
  });
});

describe("POST /api/requests", () => {
  it("REQ-BFF-1: rejects invalid input before calling the platform service", async () => {
    const res = await POST(postRequest({ requesterName: "A" }));
    expect(res.status).toBe(400);
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("uses lib/messages.ts copy, not zod's default text, so server and client errors read identically", async () => {
    const res = await POST(postRequest({ requesterName: "A" }));
    const json = await res.json();
    expect(json.fields.requesterName).toBe(MESSAGES.requesterName.required);
  });

  it("REQ-CREATE-3: forwards valid input and returns the created request", async () => {
    vi.mocked(createRequest).mockResolvedValue({
      ok: true,
      status: 201,
      data: { id: 4, ...validPayload, status: "pending", createdAt: "2026-09-29T00:00:00.000Z" },
    });
    const res = await POST(postRequest(validPayload));
    expect(res.status).toBe(201);
    expect(createRequest).toHaveBeenCalledWith(expect.objectContaining({ requesterName: "Jamie Lee" }));
  });

  it("REQ-BFF-2: a validation failure includes which field failed (structured shape)", async () => {
    const res = await POST(postRequest({ ...validPayload, requesterName: "A" }));
    const json = await res.json();
    expect(json.fields?.requesterName).toBeTruthy();
  });
});
