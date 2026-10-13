import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { trafficStatsQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/admin/analytics/traffic?days=` → `GET /api/v1/analytics/traffic-stats`.
 * Admin-gated upstream (DEV-045); the adapter forwards the token only.
 */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(trafficStatsQuery, new URL(request.url).searchParams);
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/analytics/traffic-stats",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
