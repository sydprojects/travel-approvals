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

/**
 * REQ-BFF-2 / REQ-BFF-3: maps a downstream status code to a fixed,
 * user-facing message, per the table in docs/requirements.md. Takes only
 * a status code, never the downstream body, so there is no code path by
 * which a leaked secret could reach the mapped output.
 *
 * TODO(eduardo): implement from the table in docs/requirements.md.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally unused until the stub below is implemented
export function mapDownstreamError(_status: number): MappedError {
  throw new Error("mapDownstreamError not implemented - TODO(eduardo): implement from the table in docs/requirements.md");
}
