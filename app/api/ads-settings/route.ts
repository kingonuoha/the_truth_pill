import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { noQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/ads-settings` → `GET /api/v1/ads-settings/ads-settings`
 * (`@Public()` on Nest). Anonymous-capable; frozen defaults are returned when no
 * row exists. Any query key is a 400.
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/ads-settings/ads-settings",
      sub: callerSub(session?.user?.id),
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}
