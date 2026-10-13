import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictBody, proxyToNest, readJsonBody, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { completeTourBody } from "@/lib/bff-schemas";

/**
 * `POST /api/me/tours` → `POST /api/v1/users/me/tours`.
 *
 * Session required. Records a completed tour for the token `sub`; `tourId` is
 * the only accepted field (a status marker, not identity).
 */
export async function POST(request: Request) {
  return runBff("write:engagement", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(completeTourBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/users/me/tours",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
