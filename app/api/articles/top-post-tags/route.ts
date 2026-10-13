import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { topPostTagsQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/articles/top-post-tags?limit=5` → `GET /api/v1/articles/top-post-tags`
 * (`@Public()` + `@PublicOperation()` on Nest, `articles.controller.ts:173-175`).
 *
 * **Anonymous-capable**, same posture as every other navbar read: the tag cloud
 * is public content chrome, so a token is minted only when a session exists and
 * an anonymous caller sends no `Authorization` header.
 *
 * `limit` is the only accepted key, bounded 1–50 exactly as Nest's
 * `TopPostTagsQueryDto` is (`@Min(1)` / `@Max(50)`), with `z.coerce` matching the
 * upstream `@Type(() => Number)` so `?limit=5` means the same on both sides.
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/articles/top-post-tags",
      sub: callerSub(session?.user?.id),
      query: parseStrictQuery(topPostTagsQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}
