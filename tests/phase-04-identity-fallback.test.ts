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

  // auth.ts must not *derive* the role: no Convex lookup, no DB read, and no
  // awaited/networked role resolution anywhere in the callbacks. The only ways
  // the claim may be written are the two display assignments below, both routed
  // through `toSessionRole`, which fails closed (tests/session-role.test.ts).
  //
  // ⚠️ The two `assert.match` lines replace an earlier blanket
  // `doesNotMatch(AUTH_SOURCE, /token\.role/)`. That blanket assertion also
  // forbade *carrying* the role, which this file's own doctrine permits
  // ("the role may be carried for display") and which the navigation shell
  // requires: with no claim at all, `session.user.role` was `undefined` for
  // every user, so an admin was rendered the member shell and had no route into
  // `/admin`. The invariant being pinned is that the role is display-only and
  // single-sourced, not that the string `token.role` is absent.
  assert.doesNotMatch(AUTH_SOURCE, /dbUser\.role/);
  assert.doesNotMatch(AUTH_SOURCE, /users\.currentUser/);
  // No Convex import (the prose may still name it as the thing we left behind).
  assert.doesNotMatch(AUTH_SOURCE, /from\s+["'][^"']*convex/);
  assert.doesNotMatch(AUTH_SOURCE, /role\s*=\s*await\b/);
  assert.match(AUTH_SOURCE, /token\.role = toSessionRole\(user\.role\)/);
  assert.match(AUTH_SOURCE, /session\.user\.role = toSessionRole\(token\.role\)/);
});

test("DEV-032: the ADR-017 bearer carries no role claim", () => {
  // The authoritative web→API credential must not encode authority. Nest's
  // RolesGuard reads `users.role` for the verified `sub` instead, so a stale or
  // forged session claim has no path to an admin operation.
  const tokenSource = readFileSync(
    new URL("../lib/api-token.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(tokenSource, /\broles?\s*:/);
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
