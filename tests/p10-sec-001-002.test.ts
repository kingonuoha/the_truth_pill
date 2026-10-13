import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { BffError, parseStrictBody } from "../lib/bff";
import {
  logArticleViewBody,
  logHeartbeatBody,
  updateSiteSettingsBody,
} from "../lib/bff-schemas";

/**
 * Regression controls for the two Phase 10 security findings closed in the
 * auth-security zone:
 *
 * - P10-SEC-001 (Medium): the BFF `updateSiteSettings` schema re-opened the
 *   DEV-064 blank-email regression by still requiring a non-empty email.
 * - P10-SEC-002 (Low / Rule 7): the public analytics server actions had no local
 *   validation and no rate limit.
 *
 * The analytics action module imports `next/headers` and `@/auth`, so it is not
 * unit-loadable; its two halves are tested where they live — the schemas and the
 * limiter primitives directly, and the action's own source for the wiring, the
 * same technique `bff-content-and-me.test.ts` uses.
 */

const UUID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER_UUID = "223e4567-e89b-12d3-a456-426614174000";

/* ------------------------------------------------------------------ *
 * P10-SEC-001 — blank email mirrors the DEV-064 API DTO
 * ------------------------------------------------------------------ */

describe("P10-SEC-001 — updateSiteSettings email mirrors the API DTO", () => {
  const base = {
    siteName: "The Truth Pill",
    siteDescription: "Public health, no spin.",
    socials: {},
  };

  it("accepts a blank email — the admin clearing the contact address", () => {
    const parsed = parseStrictBody(updateSiteSettingsBody, { ...base, email: "" });
    assert.equal(parsed.email, "");
  });

  it("accepts an absent email — no change requested", () => {
    const parsed = parseStrictBody(updateSiteSettingsBody, { ...base });
    assert.equal(parsed.email, undefined);
  });

  it("accepts a valid non-empty email", () => {
    const parsed = parseStrictBody(updateSiteSettingsBody, {
      ...base,
      email: "contact@thetruthpill.org",
    });
    assert.equal(parsed.email, "contact@thetruthpill.org");
  });

  it("still 400s a malformed non-empty email", () => {
    for (const email of ["not-an-email", "a@", "@b.co", "a b@c.co"]) {
      assert.throws(
        () => parseStrictBody(updateSiteSettingsBody, { ...base, email }),
        (error: unknown) => {
          assert.ok(error instanceof BffError);
          assert.equal(error.status, 400);
          assert.equal(error.code, "INVALID_BODY");
          return true;
        },
        email,
      );
    }
  });

  it("still 400s null — only absent and blank are skipped (matches @ValidateIf)", () => {
    assert.throws(
      () => parseStrictBody(updateSiteSettingsBody, { ...base, email: null }),
      BffError,
    );
  });

  it("still 400s a smuggled identity field", () => {
    for (const field of ["userId", "userEmail", "adminEmail", "role"]) {
      assert.throws(
        () => parseStrictBody(updateSiteSettingsBody, { ...base, email: "", [field]: "x" }),
        BffError,
        field,
      );
    }
  });
});

/* ------------------------------------------------------------------ *
 * P10-SEC-002 — strict analytics schemas
 * ------------------------------------------------------------------ */

describe("P10-SEC-002 — analytics schemas are strict and bounded", () => {
  it("logArticleViewBody accepts two UUIDs and nothing else", () => {
    const parsed = parseStrictBody(logArticleViewBody, {
      articleId: UUID,
      visitorId: OTHER_UUID,
    });
    assert.deepEqual(parsed, { articleId: UUID, visitorId: OTHER_UUID });
  });

  it("logArticleViewBody rejects a malformed visitorId, a missing field, and a non-object", () => {
    for (const raw of [
      { articleId: UUID, visitorId: "not-a-uuid" },
      { articleId: UUID },
      { visitorId: OTHER_UUID },
      "article",
      null,
    ]) {
      assert.throws(() => parseStrictBody(logArticleViewBody, raw), BffError, JSON.stringify(raw));
    }
  });

  it("logArticleViewBody rejects every identity selector (unknown key → 400)", () => {
    for (const field of ["userId", "userEmail", "adminEmail", "role", "ipAddress"]) {
      assert.throws(
        () =>
          parseStrictBody(logArticleViewBody, {
            articleId: UUID,
            visitorId: OTHER_UUID,
            [field]: "x",
          }),
        BffError,
        field,
      );
    }
  });

  it("logHeartbeatBody enforces the API's 0–3600 whole-second bound", () => {
    for (const seconds of [0, 30, 3600]) {
      assert.equal(
        parseStrictBody(logHeartbeatBody, { articleId: UUID, visitorId: OTHER_UUID, seconds })
          .seconds,
        seconds,
      );
    }
    for (const seconds of [-1, 3601, 2.5, "30", null]) {
      assert.throws(
        () =>
          parseStrictBody(logHeartbeatBody, {
            articleId: UUID,
            visitorId: OTHER_UUID,
            seconds,
          }),
        BffError,
        JSON.stringify(seconds),
      );
    }
  });
});

/* ------------------------------------------------------------------ *
 * P10-SEC-002 — the action wires validation + a per-IP limit
 * ------------------------------------------------------------------ */

describe("P10-SEC-002 — analytics action source wiring", () => {
  const source = readFileSync(
    join(import.meta.dirname, "..", "app", "actions", "analytics.ts"),
    "utf8",
  );

  it("parses both bodies with the strict schemas before the API call", () => {
    assert.match(source, /parseStrictBody\(logArticleViewBody, data\)/);
    assert.match(source, /parseStrictBody\(logHeartbeatBody, data\)/);
  });

  it("uses a RateLimiter keyed on the validated client IP for both actions", () => {
    assert.match(source, /new RateLimiter\(60, ANALYTICS_WINDOW_MS\)/);
    assert.match(source, /enforceRateLimit\(VIEW_LIMIT, await callerKey\(\)\)/);
    assert.match(source, /enforceRateLimit\(HEARTBEAT_LIMIT, await callerKey\(\)\)/);
    assert.match(source, /parseClientIp\(headerList\.get\("x-forwarded-for"\)\)/);
  });

  it("does not read a secret, log a credential, or widen a type", () => {
    assert.doesNotMatch(source, /NEXT_PUBLIC_/);
    assert.doesNotMatch(source, /:\s*any\b/);
    assert.doesNotMatch(source, /@ts-ignore|@ts-expect-error/);
    assert.doesNotMatch(source, /as unknown as/);
    // Hard Rule 8: the only log lines are the two fixed failure strings.
    assert.doesNotMatch(source, /console\.(log|warn|debug)/);
  });
});
