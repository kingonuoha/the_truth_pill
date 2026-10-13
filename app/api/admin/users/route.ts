import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  callerSub,
  parseStrictQuery,
  proxyToNest,
  requireCallerSub,
} from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { adminUsersQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/admin/users` → `GET /api/v1/admin/users`.
 *
 * Session required here; **role** is Nest's call, not the BFF's. This route only
 * proves a verified identity exists and mints a token whose `sub` is that
 * identity's `users.id`. `RolesGuard` then reads the role from the `users` row
 * for that `sub` (DoD #14), so a stale or forged `session.user.role` cannot reach
 * an admin read, and the check happens at the data rather than in a claim.
 *
 * A 403 from upstream is relayed as-is (opaque envelope) — the BFF must not
 * fall back to serving a stale list on refusal.
 */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(
      adminUsersQuery,
      new URL(request.url).searchParams,
    );
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/admin/users",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}