import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  BffError,
  MAX_STREAM_TOPICS,
  callerSub,
  isKnownStreamTopic,
  parseStrictBody,
  proxyToNest,
  readJsonBody,
} from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { createTicketBody } from "@/lib/bff-schemas";

/**
 * `POST /api/stream/ticket` → `POST /api/v1/stream/tickets`.
 *
 * The upstream operation is `@Public()` + `@OptionalAuth()` (DEV-054), so this is
 * anonymous-capable: a signed-out reader may hold a public `article:{id}` stream,
 * which is the primary use case. A session is minted into a token only when one
 * exists, because admin-class topics are refused at issuance without a
 * DB-resolved admin role (DEV-044 fail-closed).
 *
 * Three defects this route closes:
 *
 * 1. **`{ topic, eventTypes }` → `{ topics }`.** The upstream DTO accepts exactly
 *    one field, `topics`. The previous shape was a 400 on every call, and
 *    `eventTypes` has no field on the ticket at all — per-topic event projection
 *    is the connection's business (ADR-019 §6).
 * 2. **The `"global"` default is deleted.** `"global"` is not a topic in the
 *    frozen matrix, so a default of it made *every* mint fail. There is no
 *    default: a topic set is required.
 * 3. **Topic shape is checked locally** against the frozen patterns, so a typo
 *    is a local 400 instead of a wasted round trip. This is a shape check only —
 *    **authorization stays with Nest.** An `admin:*` topic requested by a
 *    signed-in non-admin is *not* refused here; it is forwarded and Nest answers
 *    403 `TOPIC_FORBIDDEN`, whose opaque envelope is relayed verbatim. The BFF
 *    never decides a role.
 *
 * The 256-bit ticket is single-use with a 30 s TTL and is returned exactly once.
 * It is never logged, and `proxyToNest` logs no response body — a raw upstream
 * `message` can therefore never reach this response (Hard Rule 4, Hard Rule 8).
 */
export async function POST(request: Request) {
  return runBff("mint:stream-ticket", request, async () => {
    const session = await auth();
    const body = parseStrictBody(createTicketBody, await readJsonBody(request));

    if (body.topics.length > MAX_STREAM_TOPICS) {
      throw new BffError(400, "INVALID_TOPICS", "Invalid topics");
    }
    for (const topic of body.topics) {
      if (!isKnownStreamTopic(topic)) {
        throw new BffError(400, "INVALID_TOPIC", "Invalid topic");
      }
    }

    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/stream/tickets",
      sub: callerSub(session?.user?.id),
      body: { topics: body.topics },
    });
    return NextResponse.json(result, { status });
  });
}