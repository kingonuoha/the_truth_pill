import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { recentActivityQuery } from "@/lib/bff-schemas";

/** `GET /api/admin/recent-activity?limit=` → `GET /api/v1/admin/recent-activity`. Admin (Nest-enforced). */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(recentActivityQuery, new URL(request.url).searchParams);
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/admin/recent-activity",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
