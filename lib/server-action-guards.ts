/**
 * Hardening primitives for public server actions (Phase 04).
 *
 * A server action is a public HTTP endpoint (AGENTS.md Security Hard Rule 7).
 * The logic here is deliberately free of Next.js, Convex, and vendor imports so
 * it can be unit-tested with `node --test` without a running app, a session, or
 * any of the empty vendor credentials (CLOUDINARY/PEXELS/AUTH_SECRET).
 *
 * Pure by design: the action files wire these to `auth()` / `headers()`; this
 * module decides. See docs/deviations.md DEV-004 (upload) and the S-025/S-026
 * findings for the behaviour these guards implement.
 */

import { isIP } from "node:net";

/**
 * An error that carries the HTTP status the action intends to signal.
 * Server actions return an opaque error to the client, but the status makes the
 * contract explicit and is what the regression tests assert against.
 */
export class ActionError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ActionError";
    this.status = status;
  }
}

/* ------------------------------------------------------------------ *
 * Session / role gates
 * ------------------------------------------------------------------ */

/**
 * Resolves the verified session email, or throws 401.
 *
 * The caller must pass `session?.user?.email` from the verified Auth.js
 * session — never a value read from the request body or a header (Hard Rule 1).
 */
export function requireSessionEmail(
  sessionEmail: string | null | undefined,
): string {
  if (typeof sessionEmail !== "string" || sessionEmail.trim() === "") {
    throw new ActionError(401, "Unauthorized");
  }
  return sessionEmail;
}

/**
 * Admin gate. The role must be read from the database row for the verified
 * session, never from a token claim (brief §3). A missing or non-admin role is
 * 401 — the caller is not permitted, and an unauthenticated caller never reached
 * this point with a role at all.
 */
export function assertAdminRole(role: string | null | undefined): void {
  if (role !== "admin") {
    throw new ActionError(401, "Unauthorized");
  }
}

/* ------------------------------------------------------------------ *
 * Client IP parsing (S-026 / DEV-024)
 * ------------------------------------------------------------------ */

const IPV4_MAPPED = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

function normaliseIp(raw: string): string | null {
  let candidate = raw.trim();
  if (candidate === "") return null;

  // Strip an optional port: `[::1]:443` -> `::1`, `1.2.3.4:443` -> `1.2.3.4`.
  const bracketed = /^\[([0-9A-Fa-f:.]+)\](?::\d+)?$/.exec(candidate);
  if (bracketed) {
    candidate = bracketed[1];
  } else {
    const withPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(candidate);
    if (withPort) candidate = withPort[1];
  }

  // An IPv4-mapped IPv6 address normalises to its dotted form so the same
  // client does not occupy two rate-limit buckets (DEV-024).
  const mapped = IPV4_MAPPED.exec(candidate);
  if (mapped && isIP(mapped[1]) === 4) return mapped[1];

  if (isIP(candidate) === 0) return null;
  return candidate;
}

/**
 * Takes the FIRST hop of an `x-forwarded-for` header and returns it only if it
 * is a valid IPv4/IPv6 address. Anything else — a comma-separated list, a
 * hostname, a malformed value, an absent header — yields `null`.
 *
 * This is the S-026 fix: the raw header is never forwarded into a third-party
 * URL path. `null` means "unknown"; callers choose a validated fallback, never
 * the raw string.
 */
export function parseClientIp(
  headerValue: string | null | undefined,
): string | null {
  if (typeof headerValue !== "string") return null;
  const firstHop = headerValue.split(",")[0] ?? "";
  return normaliseIp(firstHop);
}

/* ------------------------------------------------------------------ *
 * Rate limiting
 * ------------------------------------------------------------------ */

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window, in-memory rate limiter.
 *
 * ⚠️ Best-effort only. On Vercel each serverless instance holds its own map, so
 * the effective limit is per-instance, not global. It blunts a single-source
 * burst; it is not a distributed guarantee. A shared store (Redis/Upstash) is a
 * later-infrastructure concern, not a Phase 04 one. `now` is injectable so the
 * window logic is deterministic under test.
 */
export class RateLimiter {
  private static readonly MAX_KEYS = 10_000;

  private readonly limit: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  consume(key: string, now: number = Date.now()): RateLimitDecision {
    this.evictExpired(now);

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.limit - 1, retryAfterMs: 0 };
    }

    if (existing.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: existing.resetAt - now,
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: this.limit - existing.count,
      retryAfterMs: 0,
    };
  }

  private evictExpired(now: number): void {
    if (this.buckets.size < RateLimiter.MAX_KEYS) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

/** Consume one token for `key`, or throw 429. */
export function enforceRateLimit(
  limiter: RateLimiter,
  key: string,
  now?: number,
): void {
  if (!limiter.consume(key, now).allowed) {
    throw new ActionError(429, "Too many requests");
  }
}

/* ------------------------------------------------------------------ *
 * Response caching (S-025)
 * ------------------------------------------------------------------ */

interface TtlEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Fixed-TTL, in-memory response cache.
 *
 * Absorbs repeated identical public renders so they do not each reach the
 * third-party vendor. Same best-effort caveat as `RateLimiter`: on Vercel each
 * serverless instance holds its own map, so this is a per-instance shield, not a
 * distributed cache. `now` is injectable so expiry is deterministic under test.
 */
export class TtlCache<T> {
  private static readonly MAX_KEYS = 500;

  private readonly ttlMs: number;
  private readonly entries = new Map<string, TtlEntry<T>>();

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  get(key: string, now: number = Date.now()): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, now: number = Date.now()): void {
    if (this.entries.size >= TtlCache.MAX_KEYS) this.evictExpired(now);
    this.entries.set(key, { value, expiresAt: now + this.ttlMs });
  }

  private evictExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Pexels parameter clamping (S-025)
 * ------------------------------------------------------------------ */

export const PEXELS_LIMIT_MIN = 1;
export const PEXELS_LIMIT_MAX = 24;
export const PEXELS_PAGE_MIN = 1;
export const PEXELS_PAGE_MAX = 100;

function clampInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(Math.trunc(numeric), min), max);
}

/**
 * Clamps client-supplied `limit`/`page` into sane ranges. Clamping (rather than
 * rejecting) keeps the call usable while removing the unclamped third-party
 * consumption primitive S-025 describes.
 */
export function clampPexelsParams(
  limit: unknown,
  page: unknown,
): { limit: number; page: number } {
  return {
    limit: clampInteger(limit, PEXELS_LIMIT_MIN, PEXELS_LIMIT_MAX, 5),
    page: clampInteger(page, PEXELS_PAGE_MIN, PEXELS_PAGE_MAX, 1),
  };
}

/* ------------------------------------------------------------------ *
 * Upload validation (DEV-004)
 * ------------------------------------------------------------------ */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const SIGNATURE_BYTES = 12;

// Allowlist, not a denylist: an unrecognised type is rejected rather than
// permitted, so a new or malformed type cannot slip past. image/svg+xml is
// deliberately absent — SVG can carry script and is delivered from this site's
// own Cloudinary host.
//
// A Map, not an object literal. `{"image/png": "png"}["constructor"]` and
// `["__proto__"]` resolve up the prototype chain to truthy values, which would
// hand a non-image Content-Type a format string and defeat the allowlist.
export const ALLOWED_IMAGE_FORMATS = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
]);

function startsWithAscii(
  bytes: Uint8Array,
  offset: number,
  value: string,
): boolean {
  for (let i = 0; i < value.length; i++) {
    if (bytes[offset + i] !== value.charCodeAt(i)) return false;
  }
  return true;
}

// entry.type is client-declared, so it is only trusted once the bytes agree.
// An out-of-range read yields undefined, which fails the comparison, so a
// truncated header is rejected rather than throwing.
function hasImageSignature(type: string, bytes: Uint8Array): boolean {
  switch (type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return startsWithAscii(bytes, 0, "\x89PNG\r\n\x1a\n");
    case "image/gif":
      return (
        startsWithAscii(bytes, 0, "GIF87a") ||
        startsWithAscii(bytes, 0, "GIF89a")
      );
    case "image/webp":
      return (
        startsWithAscii(bytes, 0, "RIFF") && startsWithAscii(bytes, 8, "WEBP")
      );
    case "image/avif":
      return (
        startsWithAscii(bytes, 4, "ftyp") &&
        (startsWithAscii(bytes, 8, "avif") || startsWithAscii(bytes, 8, "avis"))
      );
    default:
      return false;
  }
}

/**
 * Validates a client-supplied upload and returns the allowlisted format, or
 * throws 422. Size is checked before the bytes are materialised, the
 * client-declared MIME must be on the allowlist, and the file's magic bytes
 * must agree with that MIME.
 */
export async function assertUploadAllowed(entry: File): Promise<string> {
  if (entry.size === 0) throw new ActionError(422, "No file provided");

  // Checked before arrayBuffer() so an oversized body is never materialised as
  // a Buffer. next.config.ts sets serverActions.bodySizeLimit to "50mb", so
  // this 5 MB bound is the binding one.
  if (entry.size > MAX_UPLOAD_BYTES) {
    throw new ActionError(422, "File too large");
  }

  const format = ALLOWED_IMAGE_FORMATS.get(entry.type);
  if (!format) throw new ActionError(422, "Unsupported file type");

  const head = new Uint8Array(
    await entry.slice(0, SIGNATURE_BYTES).arrayBuffer(),
  );
  if (!hasImageSignature(entry.type, head)) {
    throw new ActionError(422, "Unsupported file type");
  }

  return format;
}
