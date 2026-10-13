import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { noQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/articles/bookmarked` → `GET /api/v1/articles/bookmarked-articles`.
 *
 * Session required (the one auth-required content read). Returns the caller's
 * own bookmarked articles, keyed on the verified token `sub` — never a query
 * `email`/`userId` selector (DEV-029).
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/articles/bookmarked-articles",
      sub,
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}
