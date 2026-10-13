import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { clientIpKey } from "../lib/bff";

describe("clientIpKey (S-026 / DEV-024)", () => {
  function req(headers: Record<string, string>): Request {
    return new NextRequest("http://test.local", { headers });
  }

  it("prefers x-forwarded-for first hop", () => {
    const r = req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    assert.equal(clientIpKey(r), "1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const r = req({ "x-real-ip": "2.3.4.5" });
    assert.equal(clientIpKey(r), "2.3.4.5");
  });

  it("returns unknown when nothing parseable", () => {
    const r = req({ "x-forwarded-for": "garbage" });
    assert.equal(clientIpKey(r), "unknown");
  });

  it("takes the first hop verbatim — it does not hunt for a public one", () => {
    // The shared S-026 primitive is a *shape* check, not an untrust filter: it
    // returns the first syntactically valid hop. Vercel overwrites
    // `x-forwarded-for` with a value it constructed, so the first hop is the
    // real client and is not attacker-controlled.
    const r = req({ "x-forwarded-for": "127.0.0.1, 1.2.3.4" });
    assert.equal(clientIpKey(r), "127.0.0.1");
  });

  it("strips ports and IPv6 brackets", () => {
    const r = req({ "x-forwarded-for": "[2001:db8::1]:443, 1.2.3.4" });
    assert.equal(clientIpKey(r), "2001:db8::1");
  });

  it("IPv4-mapped IPv6 normalises to a single IPv4 bucket", () => {
    const r = req({ "x-forwarded-for": "::ffff:192.0.2.1" });
    assert.equal(clientIpKey(r), "192.0.2.1");
  });

  it("valid IPv6 and optional ports are handled", () => {
    const r = req({ "x-forwarded-for": "[2001:db8::2]:1234" });
    assert.equal(clientIpKey(r), "2001:db8::2");
  });
});