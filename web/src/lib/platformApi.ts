import type { TravelRequest } from "./types";

const PLATFORM_API_URL = process.env.PLATFORM_API_URL ?? "http://localhost:4000";
const PLATFORM_TIMEOUT_MS = Number(process.env.PLATFORM_TIMEOUT_MS) || 5000;

export type PlatformResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; body: unknown };

async function call<T>(path: string, init?: RequestInit): Promise<PlatformResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${PLATFORM_API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: AbortSignal.timeout(PLATFORM_TIMEOUT_MS),
    });
  } catch (err) {
    // REQ-BFF-3: a stalled request is distinguished from an outright
    // network failure, since they map to different statuses downstream
    // (504 vs 502). AbortSignal.timeout()'s abort reason is specifically
    // a "TimeoutError" DOMException, distinct from a manual abort.
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, status: 504, body: undefined };
    }
    return { ok: false, status: 502, body: undefined };
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, status: res.status, body };
  }
  return { ok: true, status: res.status, data: body as T };
}

export function listRequests() {
  return call<{ items: TravelRequest[] }>("/requests");
}

export function getRequest(id: number) {
  return call<TravelRequest>(`/requests/${id}`);
}

export function createRequest(input: unknown) {
  return call<TravelRequest>("/requests", { method: "POST", body: JSON.stringify(input) });
}

export function decideRequest(id: number, input: unknown) {
  return call<TravelRequest>(`/requests/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
