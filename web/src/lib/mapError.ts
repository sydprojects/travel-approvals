import type { ZodError } from "zod";

export type MappedError = {
  status: number;
  body: { error: string; fields?: Record<string, string> };
};

/**
 * Decision 2 (docs/requirements.md, REQ-BFF-2), resolved: structured
 * { error, fields } over a flat message. The extra mapping code is worth
 * it because it lets the BFF's own zod validation (the authoritative
 * check, per REQ-BFF-1) surface a real per-field message to the form
 * (REQ-CREATE-2), not just duplicate what client-side validation already
 * caught - this is what makes server-side validation errors actually
 * visible to the user instead of only existing to protect the API.
 */
export function mapValidationError(error: ZodError): MappedError {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return {
    status: 400,
    body: { error: "Validation failed. Please check the highlighted fields.", fields },
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
