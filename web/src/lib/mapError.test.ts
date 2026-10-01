import { describe, expect, it } from "vitest";
import { mapDownstreamError } from "./mapError";

/**
 * REQ-BFF-2 / REQ-BFF-3 table. mapDownstreamError is intentionally left
 * as a stub that throws (see mapError.ts) - these tests are expected to
 * fail until that table is implemented. That is the point: they pin down
 * the exact decided copy per status so there is a single, unambiguous
 * definition of "done" for this piece.
 */
describe("mapDownstreamError (REQ-BFF-2/3 table)", () => {
  it("400 -> 400 with the fixed copy", () => {
    expect(mapDownstreamError(400)).toEqual({
      status: 400,
      body: { error: "Some details could not be accepted." },
    });
  });

  it("404 -> 404 with the fixed copy", () => {
    expect(mapDownstreamError(404)).toEqual({
      status: 404,
      body: { error: "Request not found." },
    });
  });

  it("409 -> 409 with the fixed copy", () => {
    expect(mapDownstreamError(409)).toEqual({
      status: 409,
      body: { error: "This request has already been decided." },
    });
  });

  it("504 (timeout) -> 504 with the fixed copy", () => {
    expect(mapDownstreamError(504)).toEqual({
      status: 504,
      body: { error: "The service took too long. Please try again." },
    });
  });

  it("anything else (network failure / downstream 5xx) -> 502 with the fixed copy", () => {
    for (const status of [500, 502, 503, 418, 0]) {
      expect(mapDownstreamError(status)).toEqual({
        status: 502,
        body: { error: "The service is unavailable. Please try again." },
      });
    }
  });

  it("never leaks a downstream body, even one containing a secret - by construction, not by discipline", () => {
    // mapDownstreamError's signature takes only a status code; there is no
    // parameter through which a downstream body (e.g. containing
    // "SECRET stack trace") could ever reach this function, so it cannot
    // appear in any output it produces, for any status in the table.
    for (const status of [400, 404, 409, 500, 504]) {
      expect(JSON.stringify(mapDownstreamError(status))).not.toContain("SECRET stack trace");
    }
  });
});
