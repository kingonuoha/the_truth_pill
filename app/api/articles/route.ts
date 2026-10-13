import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { listArticlesQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/articles` → `GET /api/v1/articles` (`@Public()` on Nest).
 *
 * Anonymous-capable: the upstream operation is public, so a signed-out visitor
 * is proxied with **no** `Authorization` header. When a session exists the token
 * is minted so the caller still gets whatever attribution the API gives an
 * identified reader. A hard 401 here would render the public site empty.
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const query = parseStrictQuery(
      listArticlesQuery,
      new URL(request.url).searchParams,
    );
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/articles",
      sub: callerSub(session?.user?.id),
      query,
    });
    return NextResponse.json(body, { status });
  });
}