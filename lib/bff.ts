/**
 * Plumbing for the thin Next BFF under `web/app/api/**` (ADR-019 §1, Hard Rule 7).
 *
 * Deliberately free of `next/server`, `next-auth`, and vendor imports so the
 * whole guard / validation / rate-limit / proxy decision surface is unit-testable
 * with `node --test` — the same trick `lib/server-action-guards.ts` uses. The
 * route files are five-line adapters over this module; the decisions live here.
 *
 * Three rules this module exists to make mechanical:
 *
 * 1. **A `@Public()` Nest operation is proxied anonymously.** 41 of the 129
 *    operations carry `@Public()` and need no credential, so an anonymous
 *    visitor must reach them. Minting a token requires a `sub`, so a hard 401 on
 *    every route would render the public site empty. `sub: null` therefore means
 *    "send no `Authorization` header"; it never means "send a fake principal".
 *    There is deliberately **no** anonymous token principal and **no**
 *    anonymous scope — that would be a new authentication mode and needs its
 *    own ADR.
 * 2. **Every input is validated and unknown fields are a 400** (Hard Rule 7).
 *    Bodies and query strings are rebuilt from the parsed value, so a smuggled
 *    field cannot survive validation.
 * 3. **Nothing internal is ever forwarded.** A non-2xx upstream body is relayed
 *    only when it matches Nest's opaque `ErrorEnvelope`; a 5xx, an HTML body, or
 *    anything unrecognised becomes a generic envelope (Hard Rule 4).
 */

import { z } from "zod";
import { mintApiToken, nestApiBaseUrl } from "./api-token";
import { RateLimiter, parseClientIp } from "./server-action-guards";

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

/**
 * A failure the BFF is willing to describe to the client. `message` is always a
 * short, fixed string chosen here — never an exception message, an upstream
 * body, or anything that could carry internals (Hard Rule 4).
 */
export class BffError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "BffError";
    this.status = status;
    this.code = code;
  }
}

/** 401 — no verified session on a route that requires one. */
export function unauthorized(): BffError {
  return new BffError(401, "UNAUTHORIZED", "Unauthorized");
}

/** 503 — fail closed because `API_TOKEN_SECRET` is unset (ADR-019 §3). */
export function apiUnavailable(): BffError {
  return new BffError(503, "API_UNAVAILABLE", "Service unavailable");
}

/* ------------------------------------------------------------------ *
 * Session gate
 * ------------------------------------------------------------------ */

/**
 * The only identity source the BFF has: the verified Auth.js session's `sub`,
 * which is the Postgres `users.id` the ADR-017 token carries (ADR-007).
 *
 * Callers pass `session?.user?.id` — never a value from a body or a query
 * (Hard Rule 1). Returns `null` for an anonymous caller; the caller decides
 * whether that is acceptable for the operation.
 */
export function callerSub(sessionUserId: string | null | undefined): string | null {
  if (typeof sessionUserId !== "string") return null;
  const trimmed = sessionUserId.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Gate for a route whose Nest operation is **not** `@Public()`. Throws 401.
 *
 * Authority beyond this — the admin role — is Nest's `RolesGuard` reading the
 * `users` row for the verified `sub` (DoD #14). The BFF never reads
 * `session.user.role`, because a stale or forged role claim in the session must
 * not be able to reach an admin read.
 */
export function requireCallerSub(sessionUserId: string | null | undefined): string {
  const sub = callerSub(sessionUserId);
  if (sub === null) throw unauthorized();
  return sub;
}

/* ------------------------------------------------------------------ *
 * Rate limiting (Hard Rule 7)
 * ------------------------------------------------------------------ */

/**
 * Per-route limits, in requests per window, keyed per client IP.
 *
 * Sized by cost, as ADR-019 requires: a static content read is cheap and gets a
 * generous budget; the analytics ingest and the ticket mint each cost a write or
 * a bounded allocation on the API and get a tight one; a role change is the
 * rarest and most privileged write on the surface.
 *
 * ⚠️ Per-instance, like every limiter in this project. On Vercel each serverless
 * instance holds its own map, so this is a per-instance shield against a
 * single-source burst, not a distributed guarantee. A shared store is a Phase 11
 * item (ADR-019 / brief "Not done here").
 */
export const ROUTE_LIMITS = {
  /** Cheap cached-shaped public reads. */
  "read:content": { limit: 120, windowMs: 60_000 },
  /** Admin list read. */
  "read:admin": { limit: 30, windowMs: 60_000 },
  /** Reaction / bookmark / comment writes. */
  "write:engagement": { limit: 30, windowMs: 60_000 },
  /** Role change — rare and privileged. */
  "write:admin": { limit: 10, windowMs: 60_000 },
  /** Page-visit ingest — a DB write per call. */
  "ingest:analytics": { limit: 60, windowMs: 60_000 },
  /**
   * Newsletter subscribe — the only **anonymous** write on the surface.
   *
   * `UsersService.subscribeToNewsletter` is not a single cheap insert: for an
   * unknown address it runs a `user.create` (a guest `users` row) plus a
   * `user.update` and a scoped confirmation-token mint. That makes it both a
   * row-farming and an email-bomb vector if it is left as generous as
   * `ingest:analytics`, which is why it gets its own, much tighter class rather
   * than being folded into the authenticated `write:engagement` budget. Five a
   * minute per client is far above any real reader — the footer, the newsletter
   * block, and the bar each submit once per user action.
   */
  "write:newsletter": { limit: 5, windowMs: 60_000 },
  /** SSE ticket mint — the most expensive call on the surface. */
  "mint:stream-ticket": { limit: 20, windowMs: 60_000 },
} as const;

export type RouteKey = keyof typeof ROUTE_LIMITS;

const limiters = new Map<RouteKey, RateLimiter>();

function limiterFor(routeKey: RouteKey): RateLimiter {
  const existing = limiters.get(routeKey);
  if (existing) return existing;
  const { limit, windowMs } = ROUTE_LIMITS[routeKey];
  const created = new RateLimiter(limit, windowMs);
  limiters.set(routeKey, created);
  return created;
}

/**
 * The client IP used as the rate-limit bucket key.
 *
 * Takes the first hop of `x-forwarded-for` and keeps it only if it parses as an
 * IP — the S-026 / DEV-024 rule, reused so a raw header is never a bucket key.
 * When nothing parses, every such caller shares the `"unknown"` bucket. That is
 * deliberately the *stricter* failure: an unidentifiable client cannot escape the
 * limit by omitting a header.
 */
export function clientIpKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  return parseClientIp(forwarded) ?? parseClientIp(real) ?? "unknown";
}

/**
 * Consume one token for `routeKey` + client IP, or throw 429.
 *
 * Called before the session check and before `auth()`, so an unauthenticated
 * flood is bounded without ever reaching a credential verification.
 */
export function rateLimitRoute(
  routeKey: RouteKey,
  request: Request,
  now?: number,
): void {
  const decision = limiterFor(routeKey).consume(
    `${routeKey}:${clientIpKey(request)}`,
    now,
  );
  if (!decision.allowed) {
    throw new BffError(429, "TOO_MANY_REQUESTS", "Too many requests");
  }
}

/* ------------------------------------------------------------------ *
 * Token minting — fail closed (ADR-019 §3)
 * ------------------------------------------------------------------ */

/**
 * Mint the ADR-017 bearer for `sub`, or throw a 503.
 *
 * `mintApiToken` throws when `API_TOKEN_SECRET` is unset, and that is correct:
 * ADR-019 §3 forbids an unsigned fallback, so a missing secret is a loud failure
 * rather than a silent downgrade to an unauthenticated call. The throw is caught
 * here so a route handler answers with a controlled 503 instead of an unhandled
 * exception that a dev build may render with a stack.
 *
 * The secret is never logged, and neither is the underlying error's message.
 */
export function apiTokenFor(sub: string): string {
  try {
    return mintApiToken(sub).token;
  } catch {
    console.error(
      "[bff] API_TOKEN_SECRET is not configured — refusing to call the API (fail closed)",
    );
    throw apiUnavailable();
  }
}

/* ------------------------------------------------------------------ *
 * Validation (Hard Rule 7)
 * ------------------------------------------------------------------ */

/**
 * Validate a JSON body against a **strict** schema, or throw 400.
 *
 * Every schema used with this is a `z.strictObject`, so an unknown field — a
 * smuggled `userId`, `userEmail`, `adminEmail`, or `role` — is a 400 rather than
 * being silently stripped and forwarded. The caller gets `parsed.data`, never the
 * raw input, so nothing unvalidated can reach the API.
 */
export function parseStrictBody<S extends z.ZodType>(
  schema: S,
  raw: unknown,
): z.output<S> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new BffError(400, "INVALID_BODY", "Invalid request body");
  }
  return parsed.data;
}

/** Read and validate a JSON body, or throw 400 on malformed JSON. */
export async function readJsonBody(request: Request): Promise<unknown> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new BffError(400, "INVALID_BODY", "Invalid request body");
  }
  return raw;
}

/**
 * Validate a query string against a **strict** schema and return the rebuilt
 * `URLSearchParams`.
 *
 * The value is rebuilt from the parsed output rather than passed through, so
 * duplicate keys, alternate casings, and unknown keys cannot survive. A route
 * that takes no query at all passes an empty-object schema, which turns any
 * `?anything` into a 400 — the same default-deny the API applies via
 * `forbidNonWhitelisted`.
 */
export function parseStrictQuery<S extends z.ZodType>(
  schema: S,
  searchParams: URLSearchParams,
): URLSearchParams {
  const raw: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    // A repeated key is a smuggling attempt, not a legitimate list.
    if (key in raw) {
      throw new BffError(400, "INVALID_QUERY", "Invalid query parameters");
    }
    raw[key] = value;
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new BffError(400, "INVALID_QUERY", "Invalid query parameters");
  }

  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed.data as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    out.set(key, String(value));
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * SSE topics (docs/endpoints/sse-guard-matrix.md §2)
 * ------------------------------------------------------------------ */

const UUID_SOURCE =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

const ARTICLE_TOPIC = new RegExp(`^article:${UUID_SOURCE}$`);
const ENGAGEMENT_TOPIC = new RegExp(`^engagement:${UUID_SOURCE}$`);

/** The six fixed admin / analytics topic names (matrix §2). */
export const ADMIN_STREAM_TOPICS: ReadonlySet<string> = new Set([
  "analytics:realtime",
  "admin:globalStats",
  "admin:activity",
  "admin:emails",
  "admin:drafts",
  "admin:aiStatus",
]);

/** `SSE_MAX_TOPICS_PER_CONNECTION` default (matrix §4.1). */
export const MAX_STREAM_TOPICS = 8;

/**
 * Whether a topic matches a frozen pattern. There is **no** `global` topic —
 * the previous default was not a topic at all, so every default mint failed.
 */
export function isKnownStreamTopic(topic: string): boolean {
  return (
    ARTICLE_TOPIC.test(topic) ||
    ENGAGEMENT_TOPIC.test(topic) ||
    ADMIN_STREAM_TOPICS.has(topic)
  );
}

/** Whether a topic requires the DB-resolved admin role (matrix §2). */
export function isAdminStreamTopic(topic: string): boolean {
  return ADMIN_STREAM_TOPICS.has(topic);
}

/* ------------------------------------------------------------------ *
 * Proxy
 * ------------------------------------------------------------------ */

export type UpstreamMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ProxyRequest {
  method: UpstreamMethod;
  /** Path below the `/api/v1` prefix, e.g. `/articles/by-slug`. */
  path: string;
  /**
   * The verified session `sub`, or `null` for an anonymous caller. `null` sends
   * **no** `Authorization` header — it is valid only for a `@Public()` Nest
   * operation, and 41 of them are.
   */
  sub: string | null;
  query?: URLSearchParams;
  /** Already validated by `parseStrictBody`. Serialized as JSON. */
  body?: unknown;
  /**
   * The **validated** client IP to forward as `x-forwarded-for`. Only for an
   * operation that derives an IP server-side (the analytics ingest, DEV-024) —
   * and it is the parsed first hop from `clientIpKey`, never the raw header.
   * Omit it and no IP is forwarded.
   */
  clientIp?: string;
  /** Test seam. Defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
}

export interface ProxyResponse {
  status: number;
  body: unknown;
}

/** The generic envelope used whenever an upstream body is not relayed. */
function genericEnvelope(status: number): Record<string, unknown> {
  const message =
    status >= 500
      ? "Internal server error"
      : status === 429
        ? "Too many requests"
        : status === 403
          ? "Forbidden"
          : status === 401
            ? "Unauthorized"
            : status === 404
              ? "Not found"
              : "Request failed";
  const code =
    status >= 500
      ? "UPSTREAM_ERROR"
      : status === 429
        ? "TOO_MANY_REQUESTS"
        : status === 403
          ? "FORBIDDEN"
          : status === 401
            ? "UNAUTHORIZED"
            : status === 404
              ? "NOT_FOUND"
              : "UPSTREAM_REJECTED";
  return { statusCode: status, code, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Whether a body is Nest's opaque `ErrorEnvelope`.
 *
 * Relaying a 4xx body is only safe because the API's global filter builds it
 * from a fixed status→message table. Checking the shape here makes that
 * guarantee local: a body that is not recognisably an envelope is replaced
 * rather than passed on.
 */
function isErrorEnvelope(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.statusCode === "number" && typeof value.code === "string";
}

/**
 * Proxy one call to Nest and return a safe status + body.
 *
 * - `sub: null` → **no** `Authorization` header (a `@Public()` operation).
 * - `sub: string` → a freshly minted 300 s ADR-017 bearer, which exists only in
 *   this outbound header (ADR-019 §3).
 * - Transport failure → 502.
 * - Upstream 5xx, non-JSON, or unrecognised error body → generic envelope; the
 *   status is preserved so the caller can still distinguish 401 from 403.
 * - Upstream 4xx with a recognisable envelope → relayed verbatim, because that
 *   envelope is opaque by construction.
 *
 * Never logs a token, a body, or a query value.
 */
export async function proxyToNest(req: ProxyRequest): Promise<ProxyResponse> {
  const url = new URL(`${nestApiBaseUrl()}/api/v1${req.path}`);
  if (req.query) {
    for (const [key, value] of req.query.entries()) url.searchParams.set(key, value);
  }

  const headers = new Headers({ Accept: "application/json" });
  if (req.sub !== null) {
    headers.set("Authorization", `Bearer ${apiTokenFor(req.sub)}`);
  }
  if (req.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (req.clientIp !== undefined && req.clientIp !== "unknown") {
    headers.set("x-forwarded-for", req.clientIp);
  }

  const doFetch = req.fetchImpl ?? globalThis.fetch;

  let response: Response;
  try {
    response = await doFetch(url.toString(), {
      method: req.method,
      headers,
      body: req.body === undefined ? undefined : JSON.stringify(req.body),
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    console.error("[bff] upstream request failed", { path: req.path, method: req.method });
    throw new BffError(502, "UPSTREAM_UNAVAILABLE", "Upstream unavailable");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  // A non-JSON body (HTML from a proxy, plain text from a crash) is discarded
  // unread-forwards: Hard Rule 4 says none of it reaches the client.
  const parsed: unknown = isJson ? await response.json().catch(() => null) : null;

  if (response.ok) {
    return { status: response.status, body: parsed };
  }

  if (response.status >= 500) {
    console.error("[bff] upstream error", {
      path: req.path,
      method: req.method,
      status: response.status,
    });
    return { status: response.status, body: genericEnvelope(response.status) };
  }

  if (isErrorEnvelope(parsed)) {
    return { status: response.status, body: parsed };
  }

  return { status: response.status, body: genericEnvelope(response.status) };
}