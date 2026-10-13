import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  callerSub,
  parseStrictBody,
  parseStrictQuery,
  proxyToNest,
  readJsonBody,
  requireCallerSub,
} from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { noQuery, updateAiSettingsBody } from "@/lib/bff-schemas";

/** `GET /api/admin/ai/settings` → `GET /api/v1/ai/settings` (`apiKey` projected out). Admin. */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/ai/settings",
      sub,
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}

/** `PATCH /api/admin/ai/settings` → `PATCH /api/v1/ai/update-settings`. Admin; key write-only. */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(updateAiSettingsBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/ai/update-settings",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
