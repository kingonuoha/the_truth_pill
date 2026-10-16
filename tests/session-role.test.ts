/**
 * Regression test for the missing admin navigation.
 *
 * `session.user.role` was never populated: `auth.ts`'s `jwt` callback only set
 * `token.sub`, so the `session` callback had no role to expose and every
 * consumer read `undefined`. The navbar therefore rendered the member shell for
 * admins — no "Admin Panel" entry, no route into `/admin`, and so no access to
 * the admin sidebar or the article editor.
 *
 * The role is display-only (DEV-032): Nest re-reads `users.role` from the DB on
 * every request, so a stale claim grants nothing. That is why the helper must
 * fail closed — a missing or malformed value may only ever hide the admin
 * navigation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { toSessionRole } from "../lib/auth-role";

describe("toSessionRole (session role claim)", () => {
  it("passes through the DB admin role so the admin shell renders", () => {
    assert.equal(toSessionRole("admin"), "admin");
  });

  it("passes through a member role", () => {
    assert.equal(toSessionRole("user"), "user");
  });

  it("fails closed for a missing claim — the pre-fix defect", () => {
    // `undefined` is exactly what the session callback saw before the fix.
    assert.equal(toSessionRole(undefined), "user");
    assert.equal(toSessionRole(null), "user");
    assert.equal(toSessionRole(""), "user");
  });

  it("fails closed for a forged or malformed value", () => {
    assert.equal(toSessionRole("ADMIN"), "user");
    assert.equal(toSessionRole("superadmin"), "user");
    assert.equal(toSessionRole(1), "user");
    assert.equal(toSessionRole({ role: "admin" }), "user");
    assert.equal(toSessionRole(["admin"]), "user");
  });
});
