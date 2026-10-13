import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictBody, proxyToNest, readJsonBody } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { unsubscribeBody } from "@/lib/bff-schemas";

/**
 * `POST /api/newsletter/unsubscribe` → `POST /api/v1/users/newsletter/unsubscribe`
 * (`@Public()` on Nest).
 *
 * The body carries a signed, single-use unsubscribe token (DEV-035), which is
 * what the API emits in its `unsubscribeUrl` (`?token=…`). A bare `email`
 * selector is a strict-schema 400 — never accepted as identity.
 */
export async function POST(request: Request) {
  return runBff("write:newsletter", request, async () => {
    const session = await auth();
    const body = parseStrictBody(unsubscribeBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/users/newsletter/unsubscribe",
      sub: callerSub(session?.user?.id),
      body,
    });
    return NextResponse.json(result, { status });
  });
}
