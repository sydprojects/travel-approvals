import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("platformApi timeout handling (REQ-BFF-3)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("PLATFORM_TIMEOUT_MS", "20");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("a request that never completes is mapped to status 504, not left hanging", async () => {
    // A mock that never resolves on its own - only reacts to the abort
    // signal our code attaches, exactly like a real stalled connection
    // would once AbortSignal.timeout() fires.
    vi.spyOn(global, "fetch").mockImplementation((_url, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
      });
    });

    const { listRequests } = await import("./platformApi");
    const result = await listRequests();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(504);
  }, 2000);

  it("network failure (fetch rejects outright) is mapped to status 502", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new TypeError("fetch failed"));

    const { listRequests } = await import("./platformApi");
    const result = await listRequests();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(502);
  });
});
