import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ActionError,
  ALLOWED_IMAGE_FORMATS,
  assertAdminRole,
  assertUploadAllowed,
  enforceRateLimit,
  MAX_UPLOAD_BYTES,
  RateLimiter,
  requireSessionEmail,
} from "../lib/server-action-guards.ts";

const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function fileOf(
  bytes: Uint8Array | number,
  name: string,
  type: string,
): File {
  const source =
    typeof bytes === "number"
      ? new Uint8Array(bytes)
      : new Uint8Array(bytes);
  return new File([source], name, { type });
}

function statusOf(fn: () => unknown): number {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof ActionError, "expected an ActionError");
    return error.status;
  }
  throw new Error("expected the function to throw");
}

async function asyncStatusOf(fn: () => Promise<unknown>): Promise<number> {
  try {
    await fn();
  } catch (error) {
    assert.ok(error instanceof ActionError, "expected an ActionError");
    return error.status;
  }
  throw new Error("expected the function to throw");
}

test("DEV-004: no session -> 401", () => {
  assert.equal(statusOf(() => requireSessionEmail(undefined)), 401);
  assert.equal(statusOf(() => requireSessionEmail(null)), 401);
  assert.equal(statusOf(() => requireSessionEmail("")), 401);
  assert.equal(statusOf(() => requireSessionEmail("   ")), 401);
});

test("DEV-004: session present but not admin -> 401", () => {
  assert.equal(requireSessionEmail("admin@example.com"), "admin@example.com");
  assert.equal(statusOf(() => assertAdminRole(undefined)), 401);
  assert.equal(statusOf(() => assertAdminRole("user")), 401);
  assert.doesNotThrow(() => assertAdminRole("admin"));
});

test("DEV-004: oversized upload -> 422", async () => {
  const oversized = fileOf(MAX_UPLOAD_BYTES + 1, "big.png", "image/png");
  assert.equal(await asyncStatusOf(() => assertUploadAllowed(oversized)), 422);
});

test("DEV-004: wrong MIME -> 422", async () => {
  const text = fileOf(new TextEncoder().encode("plain text"), "a.txt", "text/plain");
  assert.equal(await asyncStatusOf(() => assertUploadAllowed(text)), 422);

  // Allowlisted MIME whose magic bytes disagree is also rejected.
  const lying = fileOf(new TextEncoder().encode("not a png"), "a.png", "image/png");
  assert.equal(await asyncStatusOf(() => assertUploadAllowed(lying)), 422);
});

test("DEV-004: empty upload -> 422", async () => {
  const empty = fileOf(new Uint8Array(0), "a.png", "image/png");
  assert.equal(await asyncStatusOf(() => assertUploadAllowed(empty)), 422);
});

test("DEV-004: valid PNG passes and returns the allowlisted format", async () => {
  const valid = fileOf(PNG_HEADER, "a.png", "image/png");
  assert.equal(await assertUploadAllowed(valid), "png");
  assert.equal(ALLOWED_IMAGE_FORMATS.get("image/png"), "png");
});

test("DEV-004: burst -> 429", () => {
  const limiter = new RateLimiter(3, 60_000);
  const base = 1_000_000;
  for (let i = 0; i < 3; i++) {
    enforceRateLimit(limiter, "client-a", base + i);
  }
  const status = statusOf(() => enforceRateLimit(limiter, "client-a", base + 3));
  assert.equal(status, 429);

  // A different client is unaffected.
  assert.doesNotThrow(() => enforceRateLimit(limiter, "client-b", base + 3));

  // The window resets, so the client is admitted again afterwards.
  assert.doesNotThrow(() =>
    enforceRateLimit(limiter, "client-a", base + 60_001),
  );
});
