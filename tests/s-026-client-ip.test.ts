import { test } from "node:test";
import assert from "node:assert/strict";
import { parseClientIp } from "../lib/server-action-guards.ts";

test("DEV-039 (S-026): first hop of a multi-value header is taken", () => {
  assert.equal(parseClientIp("203.0.113.7, 70.41.3.18, 150.172.238.178"), "203.0.113.7");
  assert.equal(parseClientIp("198.51.100.1,10.0.0.1"), "198.51.100.1");
});

test("DEV-039 (S-026): malformed / non-address values are rejected, never forwarded", () => {
  assert.equal(parseClientIp(undefined), null);
  assert.equal(parseClientIp(null), null);
  assert.equal(parseClientIp(""), null);
  assert.equal(parseClientIp("not-an-ip"), null);
  assert.equal(parseClientIp("evil.example.com"), null);
  assert.equal(parseClientIp("999.999.999.999"), null);
  assert.equal(parseClientIp("1.2.3.4, bogus.example.com"), "1.2.3.4");
  // A raw header used as a URL-path injection vector must not survive.
  assert.equal(parseClientIp("../../etc/passwd"), null);
  assert.equal(parseClientIp("127.0.0.1/../../admin"), null);
});

test("DEV-039 (S-026): IPv4-mapped IPv6 normalises to a single IPv4 bucket", () => {
  assert.equal(parseClientIp("::ffff:192.168.0.1"), "192.168.0.1");
  assert.equal(parseClientIp("::ffff:203.0.113.7, 10.0.0.1"), "203.0.113.7");
});

test("DEV-039 (S-026): valid IPv6 and optional ports are handled", () => {
  assert.equal(parseClientIp("2001:db8::1"), "2001:db8::1");
  assert.equal(parseClientIp("[2001:db8::1]:443"), "2001:db8::1");
  assert.equal(parseClientIp("203.0.113.7:5678"), "203.0.113.7");
});
