import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { noQuery } from "@/lib/bff-schemas";

/** `GET /api/admin/analytics/device` → `GET /api/v1/analytics/device-stats`. Admin. */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/analytics/device-stats",
      sub,
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}
