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
import { toggleReactionBody } from "@/lib/bff-schemas";

/**
 * `PATCH /api/engagement/reaction` → `PATCH /api/v1/engagement/toggle-reaction`.
 *
 * Session required: the upstream operation carries no `@Public()`. The actor is
 * the token `sub` — `articleId` and `type` are the only accepted fields, so a
 * body naming a `userId` is a 400 and never reaches the API (Hard Rule 1,
 * DEV-029/030/031).
 */
export async function PATCH(request: Request) {
  return runBff("write:engagement", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(toggleReactionBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/engagement/toggle-reaction",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}