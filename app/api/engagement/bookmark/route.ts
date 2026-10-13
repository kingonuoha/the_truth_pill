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
import { toggleBookmarkBody } from "@/lib/bff-schemas";

/**
 * `PATCH /api/engagement/bookmark` → `PATCH /api/v1/engagement/toggle-bookmark`.
 *
 * Session required. `articleId` is the only accepted field; the bookmark belongs
 * to the token `sub`, so there is nothing else a caller could legitimately send.
 */
export async function PATCH(request: Request) {
  return runBff("write:engagement", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(toggleBookmarkBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/engagement/toggle-bookmark",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}