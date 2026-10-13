import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { rawVisitsQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/admin/analytics/raw-visits?type=&days=&search=&cursor=&limit=`
 * → `GET /api/v1/analytics/raw-visits`. Admin; keyset cursor (an invalid cursor
 * resets to the first page upstream).
 */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(rawVisitsQuery, new URL(request.url).searchParams);
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/analytics/raw-visits",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
