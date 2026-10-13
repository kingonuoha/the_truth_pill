import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictBody, proxyToNest, readJsonBody } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { subscribeNewsletterBody } from "@/lib/bff-schemas";

/**
 * `POST /api/newsletter/subscribe` → `POST /api/v1/users/newsletter/subscribe`
 * (`@Public()` + `@PublicOperation()` on Nest, `users.controller.ts:111-113`).
 *
 * **Anonymous-capable, and deliberately so.** The three call sites — the footer,
 * the newsletter block, and the newsletter bar — are all on public pages, and the
 * frozen Convex `users.subscribeToNewsletter` took no identity. Nest marks the
 * operation `@Public()`, so requiring a session here would break subscription for
 * exactly the readers it exists to serve. The BFF posture therefore follows the
 * decorator, not convenience: a token is minted only when a session exists, and
 * an anonymous caller sends no `Authorization` header (bff.ts rule 1). No new
 * auth mode is invented and no anonymous principal exists.
 *
 * **The body's `email` is a recipient, not an identity (Hard Rule 1).** Nest
 * looks it up against its own `users` row to choose the double-opt-in branch
 * (`{ status: 'subscribed' }` for a confirmed address, `{ status:
 * 'verification_sent' }` otherwise). Nothing in this route treats it as a caller:
 * the schema is strict, so `userId`, `userEmail`, `adminEmail`, and `role` are
 * unknown keys and therefore a 400 before any outbound call.
 *
 * Rate class `write:newsletter` (5/min/IP), not `ingest:analytics` — this is the
 * only anonymous write on the surface and it can create a guest `users` row, so
 * it must not inherit a 60/min budget. See `ROUTE_LIMITS` for the reasoning.
 *
 * The upstream response carries a scoped confirmation token when double opt-in
 * applies. `proxyToNest` logs no body and relays no raw upstream error text
 * (Hard Rule 4), and the token is never logged here either (Hard Rule 8).
 */
export async function POST(request: Request) {
  return runBff("write:newsletter", request, async () => {
    const session = await auth();
    const body = parseStrictBody(subscribeNewsletterBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/users/newsletter/subscribe",
      sub: callerSub(session?.user?.id),
      body,
    });
    return NextResponse.json(result, { status });
  });
}
