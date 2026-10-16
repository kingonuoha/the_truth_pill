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

  // auth.ts must not *derive* the role from Convex — the legacy defect this
  // rule exists for. The role it carries instead comes from the validated Nest
  // login response (credentials) or a one-off DB-backed read at sign-in
  // (Google), and only ever feeds navigation.
  assert.doesNotMatch(AUTH_SOURCE, /dbUser\.role/);
  assert.doesNotMatch(AUTH_SOURCE, /users\.currentUser/);
  // No Convex import (the prose may still name it as the thing we left behind).
  assert.doesNotMatch(AUTH_SOURCE, /from\s+["'][^"']*convex/);

  // The claim informs no decision in this file: it is written, never compared.
  // A comparison here would be a gate, which is what DEV-032 forbids.
  assert.doesNotMatch(AUTH_SOURCE, /(?:token|session\.user)\.role\s*[!=]==?/);

  // The only writes to it are the two display assignments, both routed through
  // the helper that fails closed (tests/session-role.test.ts).
  assert.match(AUTH_SOURCE, /token\.role = toSessionRole\(/);
  assert.match(AUTH_SOURCE, /session\.user\.role = toSessionRole\(/);

  // ⚠️ The comparison ban above is NOT sufficient on its own, and neither was
  // the `doesNotMatch(/token\.role/)` it replaced. Measured against `auth.ts` as
  // committed, a comparison-shaped ban misses every one of these reintroductions
  // of the DEV-032 defect:
  //
  //   if (token.role)                  // truthiness is not a comparison
  //   token?.role === "admin"          // optional chaining breaks the `.`
  //   const r = token.role;            // read is not a comparison
  //   ["admin"].includes(token.role)   // no comparison operator at all
  //   token["role"] === "admin"        // computed access
  //   token.role.trim() === "admin"    // call before the comparison
  //   session.user.role = "admin"      // a second, unconditional write
  //
  // So the invariant is not "the claim is never compared" but "the claim has
  // exactly three mentions, all of them the sanctioned display path". Any
  // further mention is a new consumer, which is the thing DEV-032 forbids.
  // Pinning the count also catches the most likely future regression: someone
  // restoring the deleted Convex lookup because "the role has to come from
  // somewhere".
  const CLAIM_REF =
    /\btoken\b\??\.role\b|\bsession\.user\.role\b|\btoken\s*\[\s*["']role["']\s*\]/g;

  /**
   * Comments are prose — they may name the claim while explaining it (as the
   * block you are reading does). Only code is asserted.
   */
  function stripComments(source: string): string {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  }

  assert.deepEqual(
    (stripComments(AUTH_SOURCE).match(CLAIM_REF) ?? [])
      .map((ref) => ref.replace(/\s+/g, ""))
      .sort(),
    ["session.user.role", "token.role", "token.role"],
    "auth.ts may mention the role claim only at its two display sites",
  );
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
