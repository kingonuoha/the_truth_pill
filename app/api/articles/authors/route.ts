import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { noQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/articles/authors` → `GET /api/v1/articles/authors` (`@Public()`).
 *
 * Anonymous-capable. Returns the S-014 public card `{id, name, profileImage}`
 * only — the frozen query returned whole admin user documents, so a token is
 * never required and never fabricated.
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/articles/authors",
      sub: callerSub(session?.user?.id),
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}
