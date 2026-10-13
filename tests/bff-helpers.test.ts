import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  BffError,
  callerSub,
  isAdminStreamTopic,
  isKnownStreamTopic,
  MAX_STREAM_TOPICS,
} from "../lib/bff";
import { parseStrictQuery } from "../lib/bff";
import { noQuery } from "../lib/bff-schemas";

describe("bff helpers", () => {
  it("callerSub returns null for undefined/null/empty", () => {
    assert.equal(callerSub(undefined), null);
    assert.equal(callerSub(null), null);
    assert.equal(callerSub(""), null);
    assert.equal(callerSub("  "), null);
  });

  it("callerSub trims", () => {
    assert.equal(callerSub(" 123e4567-e89b-12d3-a456-426614174000 "), "123e4567-e89b-12d3-a456-426614174000");
  });

  it("known stream topics: article/engagement/admin fixed", () => {
    assert.equal(isKnownStreamTopic("article:123e4567-e89b-12d3-a456-426614174000"), true);
    assert.equal(isKnownStreamTopic("engagement:123e4567-e89b-12d3-a456-426614174000"), true);
    assert.equal(isKnownStreamTopic("analytics:realtime"), true);
    assert.equal(isKnownStreamTopic("admin:globalStats"), true);
    assert.equal(isKnownStreamTopic("admin:activity"), true);
    assert.equal(isKnownStreamTopic("admin:emails"), true);
    assert.equal(isKnownStreamTopic("admin:drafts"), true);
    assert.equal(isKnownStreamTopic("admin:aiStatus"), true);
  });

  it("rejects global and unknown topics", () => {
    assert.equal(isKnownStreamTopic("global"), false);
    assert.equal(isKnownStreamTopic("article:bad"), false);
    assert.equal(isKnownStreamTopic("admin:unknown"), false);
  });

  it("admin stream topics classification", () => {
    assert.equal(isAdminStreamTopic("analytics:realtime"), true);
    assert.equal(isAdminStreamTopic("admin:globalStats"), true);
    assert.equal(isAdminStreamTopic("admin:activity"), true);
    assert.equal(isAdminStreamTopic("admin:emails"), true);
    assert.equal(isAdminStreamTopic("admin:drafts"), true);
    assert.equal(isAdminStreamTopic("admin:aiStatus"), true);
    assert.equal(isAdminStreamTopic("article:123e4567-e89b-12d3-a456-426614174000"), false);
  });

  it("noQuery rejects any query param", () => {
    assert.throws(
      () => parseStrictQuery(noQuery, new URL("http://x/?extra=1").searchParams),
      BffError,
    );
  });

  it("max stream topics constant matches matrix", () => {
    assert.equal(MAX_STREAM_TOPICS, 8);
  });
});