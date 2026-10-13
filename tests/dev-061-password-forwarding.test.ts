import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, "..", rel), "utf8");
}

const src = read("app/actions/auth.ts");

/** The 400-char window starting at a proxy path literal, i.e. its request body. */
function callWindow(pathLiteral: string): string {
  const idx = src.indexOf(pathLiteral);
  assert.notEqual(idx, -1, `expected ${pathLiteral} to be forwarded`);
  return src.slice(idx, idx + 400);
}

// DEV-061: the frozen web action pre-hashed the password with `bcrypt.hash` and
// forwarded the digest; the Nest port takes the raw password and the API hashes
// it server-side (`PasswordsService`). This is asserted by source inspection so
// it needs no secret and no running API.
describe("DEV-061 plaintext password forwarding", () => {
  it("does not import bcrypt / bcryptjs", () => {
    assert.equal(/from\s+["']bcrypt(?:js)?["']/.test(src), false, "bcrypt import");
    assert.equal(/require\(\s*["']bcrypt(?:js)?["']\s*\)/.test(src), false, "bcrypt require");
  });

  it("does not call a client-side hash function", () => {
    assert.equal(/\bbcrypt(?:js)?\s*\.\s*(?:hash|hashSync)\s*\(/.test(src), false, "bcrypt.hash(");
    assert.equal(/\b(?:hash|hashSync)\s*\(/.test(src), false, "standalone hash( call");
  });

  it("register forwards the raw password field", () => {
    const block = callWindow("/users/register");
    assert.match(block, /\bpassword\b/, "register body carries `password`");
    assert.doesNotMatch(block, /passwordHash|hashedPassword|passwordDigest/);
  });

  it("password reset forwards the raw password field", () => {
    const block = callWindow("/users/password/reset");
    assert.match(block, /\bpassword\b/, "reset body carries `password`");
    assert.doesNotMatch(block, /passwordHash|hashedPassword|passwordDigest/);
  });

  it("verify-OTP forwards the raw password as newPassword", () => {
    const block = callWindow("/otp/verify-otp-and-change-password");
    assert.match(block, /newPassword\s*:\s*password/, "OTP body carries `newPassword: password`");
    assert.doesNotMatch(block, /passwordHash|hashedPassword|passwordDigest/);
  });
});
