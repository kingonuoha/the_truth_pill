import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { noQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/site-settings` → `GET /api/v1/site-settings/site-settings`
 * (`@Public()` on Nest). Anonymous-capable.
 *
 * This is the narrow public projection (`SiteSettingsPublicDto`), so no
 * `apiKey`-class field can reach the browser through it (S-010 / DEV-034).
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/site-settings/site-settings",
      sub: callerSub(session?.user?.id),
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}