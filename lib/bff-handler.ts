/**
 * The one wrapper every BFF route handler runs inside.
 *
 * It enforces the rate limit **before** the session check and before `auth()`,
 * so an unauthenticated flood is bounded without ever reaching a credential
 * verification, and it is the single place a thrown error becomes a response.
 *
 * A `BffError` is relayed with its own fixed status and message. Anything else
 * is an unexpected failure: it is logged by route key only — never the message,
 * never a stack, never a body — and answered with an opaque 500 (Hard Rule 4).
 */

import { NextResponse } from "next/server";
import { BffError, rateLimitRoute, type RouteKey } from "./bff";

export async function runBff(
  routeKey: RouteKey,
  request: Request,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    rateLimitRoute(routeKey, request);
    return await handler();
  } catch (error) {
    if (error instanceof BffError) {
      return NextResponse.json(
        { statusCode: error.status, code: error.code, message: error.message },
        { status: error.status },
      );
    }
    console.error("[bff] unhandled route failure", { routeKey });
    return NextResponse.json(
      {
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}