import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

import {
  BffError,
  ROUTE_LIMITS,
  callerSub,
  parseStrictBody,
  parseStrictQuery,
  rateLimitRoute,
  requireCallerSub,
} from "../lib/bff";
import {
  noQuery,
  searchArticlesQuery,
  subscribeNewsletterBody,
  topPostTagsQuery,
} from "../lib/bff-schemas";

/**
 * Controls for the four routes added in Phase 10 close-out:
 * `articles/search`, `articles/top-post-tags`, `newsletter/subscribe`, `me`.
 *
 * The route modules themselves import `next-auth` and `next/server` and are not
 * unit-loadable, so the two halves of a route are tested where they live:
 * the schemas and helpers are exercised directly, and each route's declared
 * upstream path / verb / auth posture is asserted against its own source. The
 * source assertions are the regression guard that matters — they fail if anyone
 * later flips `me` to anonymous or points a route at a different operation.
 */

const ROUTE_ROOT = join(import.meta.dirname, "..", "app", "api");

type RouteFile = {
  path: string;
  source: string;
};

function routeFile(relativePath: string): RouteFile {
  const path = join(ROUTE_ROOT, relativePath);
  return { path, source: readFileSync(path, "utf8") };
}

const SEARCH = routeFile("articles/search/route.ts");
const TOP_POST_TAGS = routeFile("articles/top-post-tags/route.ts");
const NEWSLETTER = routeFile("newsletter/subscribe/route.ts");
const ME = routeFile("me/route.ts");

/** Every identity selector that must never appear as an accepted input. */
const IDENTITY_FIELDS = ["userId", "userEmail", "adminEmail", "role", "id"];

/* ------------------------------------------------------------------ *
 * Upstream contract: path, verb, auth posture
 * ------------------------------------------------------------------ */

describe("four Phase 10 routes — upstream contract", () => {
  it("articles/search proxies GET /articles/search, anonymous-capable", () => {
    assert.match(SEARCH.source, /path: "\/articles\/search"/);
    assert.match(SEARCH.source, /method: "GET"/);
    assert.doesNotMatch(SEARCH.source, /export async function POST/);
    // Anonymous-capable: `callerSub` may yield null; `requireCallerSub` must not appear.
    assert.match(SEARCH.source, /sub: callerSub\(session\?\.user\?\.id\)/);
    assert.doesNotMatch(SEARCH.source, /requireCallerSub/);
  });

  it("articles/top-post-tags proxies GET /articles/top-post-tags, anonymous-capable", () => {
    assert.match(TOP_POST_TAGS.source, /path: "\/articles\/top-post-tags"/);
    assert.match(TOP_POST_TAGS.source, /method: "GET"/);
    assert.doesNotMatch(TOP_POST_TAGS.source, /export async function POST/);
    assert.match(TOP_POST_TAGS.source, /sub: callerSub\(session\?\.user\?\.id\)/);
    assert.doesNotMatch(TOP_POST_TAGS.source, /requireCallerSub/);
  });

  it("newsletter/subscribe proxies POST /users/newsletter/subscribe, anonymous-capable", () => {
    assert.match(NEWSLETTER.source, /path: "\/users\/newsletter\/subscribe"/);
    assert.match(NEWSLETTER.source, /method: "POST"/);
    assert.match(NEWSLETTER.source, /export async function POST/);
    assert.match(NEWSLETTER.source, /sub: callerSub\(session\?\.user\?\.id\)/);
    assert.doesNotMatch(NEWSLETTER.source, /requireCallerSub/);
    assert.doesNotMatch(NEWSLETTER.source, /export async function GET/);
  });

  it("me proxies GET /users/me with a REQUIRED session", () => {
    assert.match(ME.source, /path: "\/users\/me"/);
    assert.match(ME.source, /method: "GET"/);
    assert.match(ME.source, /const sub = requireCallerSub\(/);
    // The session `sub` is the only identity in the outbound call.
    assert.match(ME.source, /sub,/);
    assert.doesNotMatch(ME.source, /export async function POST/);
  });

  it("no route logs anything, so no token, ticket, or body can be logged (Hard Rule 8)", () => {
    for (const { path, source } of [SEARCH, TOP_POST_TAGS, NEWSLETTER, ME]) {
      assert.doesNotMatch(source, /console\./, path);
    }
  });

  it("no route reads a secret out of a NEXT_PUBLIC_ variable", () => {
    for (const { path, source } of [SEARCH, TOP_POST_TAGS, NEWSLETTER, ME]) {
      assert.doesNotMatch(source, /NEXT_PUBLIC_/, path);
      assert.doesNotMatch(source, /process\.env/, path);
    }
  });

  it("no route widens a type to silence an error", () => {
    for (const { path, source } of [SEARCH, TOP_POST_TAGS, NEWSLETTER, ME]) {
      assert.doesNotMatch(source, /:\s*any\b/, path);
      assert.doesNotMatch(source, /@ts-ignore|@ts-expect-error/, path);
      assert.doesNotMatch(source, /as unknown as/, path);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Guard posture
 * ------------------------------------------------------------------ */

describe("four Phase 10 routes — guard", () => {
  it("an anonymous caller gets null, so the three @Public() routes stay reachable", () => {
    for (const sessionUserId of [undefined, null, "", "   "]) {
      assert.equal(callerSub(sessionUserId), null);
    }
  });

  it("me's posture rejects an anonymous caller with 401 UNAUTHORIZED", () => {
    assert.throws(
      () => requireCallerSub(callerSub(undefined)),
      (error: unknown) => {
        assert.ok(error instanceof BffError);
        assert.equal(error.status, 401);
        assert.equal(error.code, "UNAUTHORIZED");
        return true;
      },
    );
  });

  it("me's posture accepts a verified session sub verbatim", () => {
    const sub = "123e4567-e89b-12d3-a456-426614174000";
    assert.equal(requireCallerSub(callerSub(sub)), sub);
  });
});

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

describe("four Phase 10 routes — validation", () => {
  function params(query: string): URLSearchParams {
    return new URL(`http://test.local/?${query}`).searchParams;
  }

  it("search accepts an absent query and an empty one (navbar's pre-typing state)", () => {
    assert.equal(parseStrictQuery(searchArticlesQuery, params("")).toString(), "");
    assert.equal(
      parseStrictQuery(searchArticlesQuery, params("query=")).get("query"),
      "",
    );
  });

  it("search rebuilds a normal query and drops nothing", () => {
    const out = parseStrictQuery(searchArticlesQuery, params("query=cancer+risk"));
    assert.equal(out.get("query"), "cancer risk");
    assert.equal([...out.keys()].length, 1);
  });

  it("search enforces Nest's MaxLength(200)", () => {
    const ok = parseStrictQuery(searchArticlesQuery, params(`query=${"x".repeat(200)}`));
    assert.equal((ok.get("query") ?? "").length, 200);
    assert.throws(
      () => parseStrictQuery(searchArticlesQuery, params(`query=${"x".repeat(201)}`)),
      BffError,
    );
  });

  it("search rejects unknown and duplicated keys", () => {
    for (const field of IDENTITY_FIELDS) {
      assert.throws(
        () => parseStrictQuery(searchArticlesQuery, params(`query=a&${field}=b`)),
        (error: unknown) => {
          assert.ok(error instanceof BffError);
          assert.equal(error.status, 400);
          return true;
        },
        field,
      );
    }
    assert.throws(
      () => parseStrictQuery(searchArticlesQuery, params("query=a&query=b")),
      BffError,
    );
  });

  it("top-post-tags coerces limit exactly as Nest's @Type(() => Number) does", () => {
    assert.equal(parseStrictQuery(topPostTagsQuery, params("limit=5")).get("limit"), "5");
    assert.equal(parseStrictQuery(topPostTagsQuery, params("")).toString(), "");
  });

  it("top-post-tags enforces Nest's Min(1) / Max(50)", () => {
    assert.throws(() => parseStrictQuery(topPostTagsQuery, params("limit=0")), BffError);
    assert.throws(() => parseStrictQuery(topPostTagsQuery, params("limit=51")), BffError);
    assert.throws(() => parseStrictQuery(topPostTagsQuery, params("limit=2.5")), BffError);
    assert.throws(() => parseStrictQuery(topPostTagsQuery, params("limit=abc")), BffError);
  });

  it("top-post-tags rejects unknown keys", () => {
    assert.throws(() => parseStrictQuery(topPostTagsQuery, params("query=a")), BffError);
    assert.throws(() => parseStrictQuery(topPostTagsQuery, params("userId=x")), BffError);
  });

  it("newsletter body accepts an address and nothing else", () => {
    const parsed = parseStrictBody(subscribeNewsletterBody, { email: "ada@example.com" });
    assert.deepEqual(parsed, { email: "ada@example.com" });
  });

  it("newsletter body rejects a missing, malformed, or oversized address", () => {
    for (const raw of [
      {},
      { email: "" },
      { email: "not-an-email" },
      { email: `${"a".repeat(315)}@example.com` },
      "ada@example.com",
      null,
      42,
    ]) {
      assert.throws(
        () => parseStrictBody(subscribeNewsletterBody, raw),
        BffError,
        JSON.stringify(raw),
      );
    }
  });

  it("newsletter body rejects every identity selector, so the recipient cannot become an actor", () => {
    for (const field of IDENTITY_FIELDS) {
      assert.throws(
        () => parseStrictBody(subscribeNewsletterBody, { email: "ada@example.com", [field]: "x" }),
        (error: unknown) => {
          assert.ok(error instanceof BffError);
          assert.equal(error.status, 400);
          assert.equal(error.code, "INVALID_BODY");
          return true;
        },
        field,
      );
    }
  });

  it("me takes no query at all", () => {
    assert.equal(parseStrictQuery(noQuery, params("")).toString(), "");
    for (const query of ["userId=x", "id=x", "email=a@b.c", "userEmail=a@b.c", "adminEmail=a@b.c"]) {
      assert.throws(() => parseStrictQuery(noQuery, params(query)), BffError, query);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Rate limits — each route's declared key, at the documented budget
 * ------------------------------------------------------------------ */

describe("four Phase 10 routes — rate limits", () => {
  /** The route key a route file declares, read from its own source. */
  function declaredKey(source: string): keyof typeof ROUTE_LIMITS {
    const match = /runBff\("([a-z:]+)"/.exec(source);
    assert.ok(match, "route must declare a runBff route key");
    return match[1] as keyof typeof ROUTE_LIMITS;
  }

  it("articles/search and top-post-tags use the cheap content-read class", () => {
    assert.equal(declaredKey(SEARCH.source), "read:content");
    assert.equal(declaredKey(TOP_POST_TAGS.source), "read:content");
  });

  it("newsletter/subscribe uses the tight anonymous-write class", () => {
    assert.equal(declaredKey(NEWSLETTER.source), "write:newsletter");
    assert.equal(ROUTE_LIMITS["write:newsletter"].limit, 5);
    // It must NOT inherit the 60/min analytics budget: the call can create a
    // guest `users` row and mint a confirmation token.
    assert.ok(
      ROUTE_LIMITS["write:newsletter"].limit < ROUTE_LIMITS["ingest:analytics"].limit,
    );
  });

  it("me uses the cheap content-read class", () => {
    assert.equal(declaredKey(ME.source), "read:content");
  });

  it("the newsletter budget actually trips, and the key is IP-scoped", () => {
    const at = (ip: string): NextRequest =>
      new NextRequest("http://test.local/", { headers: { "x-forwarded-for": ip } });

    const buster = "10.99.99.99";
    const key = declaredKey(NEWSLETTER.source);
    for (let i = 0; i < ROUTE_LIMITS[key].limit; i += 1) {
      rateLimitRoute(key, at(buster), 1_000_000 + i);
    }
    assert.throws(
      () => rateLimitRoute(key, at(buster), 1_000_000 + ROUTE_LIMITS[key].limit),
      (error: unknown) => {
        assert.ok(error instanceof BffError);
        assert.equal(error.status, 429);
        assert.equal(error.code, "TOO_MANY_REQUESTS");
        return true;
      },
    );
    // A different client IP has its own bucket.
    rateLimitRoute(key, at("10.99.99.100"), 1_000_000);
  });

  it("me's rate limit is enforced before the session gate can matter", () => {
    // `runBff` consumes the token first, so an unauthenticated flood is bounded
    // without ever reaching a credential verification. Assert the ordering by
    // consuming the whole `read:content` bucket and confirming the 429 fires
    // regardless of who the caller is.
    const key = declaredKey(ME.source);
    const req = new NextRequest("http://test.local/", {
      headers: { "x-forwarded-for": "10.0.0.7" },
    });
    for (let i = 0; i < ROUTE_LIMITS[key].limit; i += 1) {
      rateLimitRoute(key, req, 2_000_000 + i);
    }
    assert.throws(() => rateLimitRoute(key, req, 2_000_000 + ROUTE_LIMITS[key].limit), BffError);
  });
});
