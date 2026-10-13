import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { noQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/me/full` → `GET /api/v1/users/me/full`.
 *
 * Session required. The caller's own profile plus engagement counts
 * (`stats.bookmarks` / `stats.comments` / `stats.reactions`), keyed on the
 * verified token `sub`. Unknown query keys are a 400.
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/users/me/full",
      sub,
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}
