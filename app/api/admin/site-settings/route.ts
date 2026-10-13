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
import { updateSiteSettingsBody } from "@/lib/bff-schemas";

/**
 * `PATCH /api/admin/site-settings` → `PATCH /api/v1/site-settings/update-site-settings`.
 * Admin (Nest-enforced). The frozen mutation was unauthenticated (S-012). The
 * public marketing fields only — no credential exists on this row (DEV-018).
 */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(updateSiteSettingsBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/site-settings/update-site-settings",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
