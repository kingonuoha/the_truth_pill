import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  callerSub,
  clientIpKey,
  parseStrictBody,
  proxyToNest,
  readJsonBody,
} from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { logPageVisitBody } from "@/lib/bff-schemas";

/**
 * `POST /api/analytics/pageview` → `POST /api/v1/analytics/log-page-visit`.
 *
 * The upstream operation is `@Public()` + `@OptionalAuth()` (DEV-024/DEV-047),
 * so this is anonymous-capable: a signed-out visitor sends **no** `Authorization`
 * header. That matters more here than on any other route, because the analytics
 * beacon fires from anonymous readers on every public page — requiring a session
 * would silently disable all traffic measurement.
 *
 * `ipAddress` is derived server-side by the API from the **validated** first
 * `x-forwarded-for` hop (DEV-024) and is not a body field; the strict schema
 * therefore rejects a caller trying to supply `ipAddress` or `userId` with a 400.
 * `clientIpKey` returns `"unknown"` when no hop parses, and that value is not
 * forwarded — an unidentifiable caller contributes no forged IP.
 */
export async function POST(request: Request) {
  return runBff("ingest:analytics", request, async () => {
    const session = await auth();
    const body = parseStrictBody(logPageVisitBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/analytics/log-page-visit",
      sub: callerSub(session?.user?.id),
      body,
      clientIp: clientIpKey(request),
    });
    return NextResponse.json(result, { status });
  });
}