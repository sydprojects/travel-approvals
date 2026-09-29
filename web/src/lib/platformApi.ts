import type { TravelRequest } from "./types";

const PLATFORM_API_URL = process.env.PLATFORM_API_URL ?? "http://localhost:4000";

export type PlatformResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; body: unknown };

async function call<T>(path: string, init?: RequestInit): Promise<PlatformResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${PLATFORM_API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    // Network failure talking to the platform service - never a crash.
    return { ok: false, status: 502, body: { error: "Platform service unreachable." } };
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
