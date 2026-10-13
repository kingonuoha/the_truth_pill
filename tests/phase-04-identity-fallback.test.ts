import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Phase 04 source contracts for the web edge.
 *
 * These pin the anti-porting rule at the source level so a later refactor cannot
 * silently reintroduce the legacy defect class:
 *   - DEV-031: the `identity || argument` fallback
 *   - DEV-032: authorizing on a role cached in the token/session claim
 *   - CN-1 G1: public auth server actions must be guarded + rate-limited
 */

const AUTH_SOURCE = readFileSync(new URL("../auth.ts", import.meta.url), "utf8");
const MIDDLEWARE_SOURCE = readFileSync(
  new URL("../middleware.ts", import.meta.url),
  "utf8",
);
const AUTH_ACTIONS_SOURCE = readFileSync(
  new URL("../app/actions/auth.ts", import.meta.url),
  "utf8",
);

test("DEV-031 / identity-fallback.spec: web auth has no identity||argument fallback", () => {
  // The legacy idiom: identity?.email || adminEmail / token?.email || args.email
  assert.doesNotMatch(AUTH_SOURCE, /\|\|\s*(adminEmail|userEmail|userId)\b/);
  assert.doesNotMatch(AUTH_SOURCE, /identity\s*\?\?/);
  assert.doesNotMatch(AUTH_SOURCE, /token\?\.email\s*\|\|/);
  // Identity now comes from the Nest login response, validated at runtime.
  assert.match(AUTH_SOURCE, /parseLoginUser/);
});

test("DEV-032 / roles-db.spec: no authorization on a token/session role claim", () => {
  // The role may be carried for display, but must not gate access in auth.ts or
  // middleware.ts. middleware is UX-redirect only.
  assert.doesNotMatch(MIDDLEWARE_SOURCE, /userRole/);
  assert.doesNotMatch(MIDDLEWARE_SOURCE, /\.role\b/);
  assert.match(MIDDLEWARE_SOURCE, /redirect/);
  // auth.ts no longer fetches the role from Convex on every JWT callback.
  assert.doesNotMatch(AUTH_SOURCE, /token\.role/);
  assert.doesNotMatch(AUTH_SOURCE, /dbUser\.role/);
  assert.doesNotMatch(AUTH_SOURCE, /users\.currentUser/);
});

test("DEV-032: the ADR-017 API token is minted server-side from a non-public secret", () => {
  const tokenSource = readFileSync(
    new URL("../lib/api-token.ts", import.meta.url),
    "utf8",
  );
  assert.match(tokenSource, /API_TOKEN_SECRET/);
  assert.doesNotMatch(tokenSource, /NEXT_PUBLIC_API_TOKEN/);
  assert.match(tokenSource, /truth-pill-api/);
});

test("CN-1 G1: public auth server actions are validated and rate-limited", () => {
  assert.match(AUTH_ACTIONS_SOURCE, /enforceRateLimit/);
  assert.match(AUTH_ACTIONS_SOURCE, /otpSendLimiter/);
  assert.match(AUTH_ACTIONS_SOURCE, /otpVerifyLimiter/);
  // password_change is a signed-in operation: it must consult the session.
  assert.match(AUTH_ACTIONS_SOURCE, /await auth\(\)/);
});
