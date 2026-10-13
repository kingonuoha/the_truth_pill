import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { referrerStatsQuery } from "@/lib/bff-schemas";

/** `GET /api/admin/analytics/referrers?days=` → `GET /api/v1/analytics/referrer-stats`. Admin. */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(referrerStatsQuery, new URL(request.url).searchParams);
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/analytics/referrer-stats",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
