import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ActionError,
  clampPexelsParams,
  enforceRateLimit,
  PEXELS_LIMIT_MAX,
  PEXELS_LIMIT_MIN,
  PEXELS_PAGE_MAX,
  PEXELS_PAGE_MIN,
  RateLimiter,
  TtlCache,
} from "../lib/server-action-guards.ts";

const PEXELS_ACTION_SOURCE = readFileSync(
  new URL("../app/actions/pexels.ts", import.meta.url),
  "utf8",
);

// DEV-038 (S-025): category imagery is public (Phase 00 §10(b)). The action must
// not gate anonymous callers; the fix for the consumption primitive is the
// clamp + per-IP limit + cache, not a session. This is a source contract so the
// gate cannot be silently reintroduced.
test("DEV-038 (S-025): anonymous callers are served (no session gate)", () => {
  assert.doesNotMatch(PEXELS_ACTION_SOURCE, /requireSessionEmail/);
  assert.doesNotMatch(PEXELS_ACTION_SOURCE, /\bauth\(\)/);
  assert.doesNotMatch(PEXELS_ACTION_SOURCE, /requireSession/);
  // The controls that actually belong: clamp, per-IP limit, short TTL cache.
  assert.match(PEXELS_ACTION_SOURCE, /clampPexelsParams/);
  assert.match(PEXELS_ACTION_SOURCE, /parseClientIp/);
  assert.match(PEXELS_ACTION_SOURCE, /enforceRateLimit/);
  assert.match(PEXELS_ACTION_SOURCE, /new TtlCache/);
});

test("DEV-038 (S-025): out-of-range limit/page are clamped, not passed through", () => {
  assert.deepEqual(clampPexelsParams(1000, 0), {
    limit: PEXELS_LIMIT_MAX,
    page: PEXELS_PAGE_MIN,
  });
  assert.deepEqual(clampPexelsParams(-5, 99999), {
    limit: PEXELS_LIMIT_MIN,
    page: PEXELS_PAGE_MAX,
  });
  assert.deepEqual(clampPexelsParams(10, 2), { limit: 10, page: 2 });
});

test("DEV-038 (S-025): non-numeric limit/page fall back to safe defaults", () => {
  assert.deepEqual(clampPexelsParams(Number.NaN, Number.NaN), {
    limit: 5,
    page: 1,
  });
  assert.deepEqual(clampPexelsParams("abc", undefined), { limit: 5, page: 1 });
  assert.deepEqual(clampPexelsParams(3.9, 4.9), { limit: 3, page: 4 });
});

test("DEV-038 (S-025): burst from one IP -> 429, another IP admitted", () => {
  const limiter = new RateLimiter(2, 60_000);
  const base = 2_000_000;
  enforceRateLimit(limiter, "203.0.113.7", base);
  enforceRateLimit(limiter, "203.0.113.7", base + 1);
  assert.throws(
    () => enforceRateLimit(limiter, "203.0.113.7", base + 2),
    (error: unknown) => error instanceof ActionError && error.status === 429,
  );
  assert.doesNotThrow(() => enforceRateLimit(limiter, "203.0.113.8", base + 2));
});

test("DEV-038 (S-025): TTL cache serves within the window and misses after it", () => {
  const cache = new TtlCache<string[]>(30_000);
  const now = 5_000_000;
  cache.set("cats\u00005\u00001", ["a.jpg"], now);
  assert.deepEqual(cache.get("cats\u00005\u00001", now + 29_999), ["a.jpg"]);
  // Expired: a miss forces a fresh vendor fetch.
  assert.equal(cache.get("cats\u00005\u00001", now + 30_000), undefined);
  // Unrelated key never present.
  assert.equal(cache.get("dogs\u00005\u00001", now), undefined);
});
