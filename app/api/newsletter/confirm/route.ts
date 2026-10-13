import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictBody, proxyToNest, readJsonBody } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { confirmNewsletterBody } from "@/lib/bff-schemas";

/**
 * `POST /api/newsletter/confirm` → `POST /api/v1/users/newsletter/confirm`
 * (`@Public()` on Nest).
 *
 * The body carries a signed, single-use confirmation token — not an identity.
 * Any other field (`userId`, `email`) is a strict-schema 400.
 */
export async function POST(request: Request) {
  return runBff("write:newsletter", request, async () => {
    const session = await auth();
    const body = parseStrictBody(confirmNewsletterBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/users/newsletter/confirm",
      sub: callerSub(session?.user?.id),
      body,
    });
    return NextResponse.json(result, { status });
  });
}
