/**
 * Regression test for the broken Google sign-in subject.
 *
 * `POST /api/v1/internal/users/store` upserts the OAuth profile and returns the
 * Postgres row id, but the response was discarded (`return response.ok`). The
 * session subject then stayed whatever `@auth/core` invented — and that is a
 * fresh `crypto.randomUUID()` per sign-in, deliberately *not* the provider
 * subject (`@auth/core/lib/actions/callback/oauth/callback.js`). No `users` row
 * matched it, so Nest answered `401 Unknown subject` to every call the session
 * made.
 *
 * A wrong or absent id must fail the sign-in closed rather than become a
 * session with an unresolvable subject.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseStoredUserId } from "../lib/auth-identity";

const UUID = "8f14e45f-ceea-467a-9e5b-1d0c1a2b3c4d";

describe("parseStoredUserId (Google upsert response)", () => {
  it("accepts the Postgres id the upsert returns", () => {
    assert.equal(parseStoredUserId({ id: UUID }), UUID);
  });

  it("tolerates extra response fields", () => {
    assert.equal(parseStoredUserId({ id: UUID, role: "admin" }), UUID);
  });

  it("trims surrounding whitespace", () => {
    assert.equal(parseStoredUserId({ id: `  ${UUID}\n` }), UUID);
  });

  it("rejects a missing id — the discarded-response defect", () => {
    assert.equal(parseStoredUserId(undefined), null);
    assert.equal(parseStoredUserId(null), null);
    assert.equal(parseStoredUserId({}), null);
    assert.equal(parseStoredUserId({ user: { id: UUID } }), null);
  });

  it("rejects a non-string or blank id", () => {
    assert.equal(parseStoredUserId({ id: 42 }), null);
    assert.equal(parseStoredUserId({ id: null }), null);
    assert.equal(parseStoredUserId({ id: "" }), null);
    assert.equal(parseStoredUserId({ id: "   " }), null);
    assert.equal(parseStoredUserId({ id: { toString: () => UUID } }), null);
  });
});
