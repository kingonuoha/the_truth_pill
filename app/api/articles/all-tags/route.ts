import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { noQuery } from "@/lib/bff-schemas";

/** `GET /api/articles/all-tags` → `GET /api/v1/articles/all-tags` (`@Public()`). Anonymous-capable. */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/articles/all-tags",
      sub: callerSub(session?.user?.id),
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}
