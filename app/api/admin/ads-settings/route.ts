import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  callerSub,
  parseStrictBody,
  proxyToNest,
  readJsonBody,
  requireCallerSub,
} from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { updateAdsSettingsBody } from "@/lib/bff-schemas";

/**
 * `PATCH /api/admin/ads-settings` → `PATCH /api/v1/ads-settings/update-ads-settings`.
 *
 * Session required; **role** is Nest's call. This adapter only proves a verified
 * identity (`sub`) and forwards the token — Nest's `RolesGuard` refuses a
 * non-admin from the DB row. Body is the strict `UpdateAdsSettingsDto`.
 */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(updateAdsSettingsBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/ads-settings/update-ads-settings",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
