/**
 * Browser-side transport for the thin Next BFF under `web/app/api/**` (ADR-019).
 *
 * Client components never hold the ADR-017 token and never call Nest directly
 * (except the SSE leg, which uses a single-use ticket). Every browser request
 * therefore goes to a same-origin `/api/...` route handler, which mints the
 * token server-side. This module is the one place that fetch/parse/error logic
 * lives, so a client component cannot accidentally build an absolute Nest URL or
 * leak an upstream error body.
 *
 * The `path` parameter is typed to `/api/${string}`: a call cannot reach an
 * arbitrary origin, so the browser can only talk to the BFF.
 */

import type * as Api from "@/types/api";

export type { Api };

/** A non-2xx BFF response. `message` is BFF-safe by construction. */
export class BffClientError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "BffClientError";
    this.status = status;
    this.body = body;
  }
}

export interface BffFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Serialized as JSON. Omit for a body-less request. */
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Call a same-origin BFF route and parse its JSON response.
 *
 * A non-2xx response throws `BffClientError`; the BFF's error bodies are opaque
 * (Hard Rule 4), so reading `message` here is safe. A non-JSON 2xx body parses
 * to `null`, matching the API's own null-body cases.
 */
export async function bffFetch<T>(
  path: `/api/${string}`,
  options: BffFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;

  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");

  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const parsed: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : null;

  if (!res.ok) {
    const message =
      parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as Record<string, unknown>).message)
        : `Request failed with status ${res.status}`;
    throw new BffClientError(res.status, message, parsed);
  }

  return parsed as T;
}
