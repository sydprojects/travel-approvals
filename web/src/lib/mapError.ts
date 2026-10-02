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

const DOWNSTREAM_ERROR_MAP: Record<number, string> = {
  400: "Some details could not be accepted.",
  404: "Request not found.",
  409: "This request has already been decided.",
  502: "The service is unavailable. Please try again.",
  504: "The service took too long. Please try again.",
};

/**
 * REQ-BFF-2 / REQ-BFF-3: maps a downstream status code to a fixed,
 * user-facing message, per the table in docs/requirements.md. Takes only
 * a status code, never the downstream body, so there is no code path by
 * which a leaked secret could reach the mapped output. Any status not in
 * the table (other downstream 5xx, anything unexpected) falls back to the
 * 502 entry, matching the table's "network / 5xx / anything else" row.
 *
 * Implemented by Eduardo.
 */
export function mapDownstreamError(status: number): MappedError {
  const isKnown = status in DOWNSTREAM_ERROR_MAP;
  const finalStatus = isKnown ? status : 502;
  return { status: finalStatus, body: { error: DOWNSTREAM_ERROR_MAP[finalStatus] } };
}
