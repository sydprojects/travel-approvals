import type { ZodError } from "zod";

export type MappedError = {
  status: number;
  body: { error: string };
};

/**
 * TODO(eduardo) - decision 2 (see docs/requirements.md, REQ-BFF-2).
 *
 * This is a deliberately minimal stub: it collapses every validation error
 * into one flat message and loses which field failed. It compiles and the
 * app runs, but any test asserting a structured `{ error, fields }' shape
 * (so the form can show per-field messages, REQ-CREATE-2) will fail until
 * you pick a shape and implement it here.
 */
export function mapValidationError(error: ZodError): MappedError {
  return {
    status: 400,
    body: { error: error.issues[0]?.message ?? "Invalid input." },
  };
}

export function mapDownstreamError(status: number, body: unknown): MappedError {
  const fallback = "The platform service could not complete this request.";
  if (status === 404) {
    return { status: 404, body: { error: "Request not found." } };
  }
  if (status === 409) {
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : "This request has already been decided.";
    return { status: 409, body: { error: message } };
  }
  // Anything else (5xx, network failure, unexpected shape) is mapped to a
  // generic 502 - the raw downstream body/stack never reaches the browser.
  return { status: 502, body: { error: fallback } };
}
