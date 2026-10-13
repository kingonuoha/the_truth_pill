import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { articleIdQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/engagement` → `GET /api/v1/engagement/engagement?articleId=…`
 * (`@Public()` + `@OptionalAuth()` on Nest — DEV-044, fail-closed).
 *
 * Anonymous-capable for the public counts. When a session exists the token is
 * minted so the API can include the caller's own reaction/bookmark state — that
 * is the whole reason the upstream route is token-**optional** rather than
 * token-free.
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const query = parseStrictQuery(
      articleIdQuery,
      new URL(request.url).searchParams,
    );
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/engagement/engagement",
      sub: callerSub(session?.user?.id),
      query,
    });
    return NextResponse.json(body, { status });
  });
}