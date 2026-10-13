import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { bySlugQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/articles/[slug]` → `GET /api/v1/articles/by-slug?slug=…`
 * (`@Public()` on Nest).
 *
 * There is no `GET /api/v1/articles/{slug}` — Nest exposes the read as a
 * `by-slug` query. The slug comes from the path segment and is validated as a
 * non-empty bounded string; the slug is a public identifier, so it is
 * user-facing and preserved verbatim (Engineering Rule 6).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const { slug } = await params;
    const query = parseStrictQuery(bySlugQuery, new URL(request.url).searchParams);
    query.set("slug", slug);
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/articles/by-slug",
      sub: callerSub(session?.user?.id),
      query,
    });
    return NextResponse.json(body, { status });
  });
}