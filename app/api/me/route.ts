import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictBody, parseStrictQuery, proxyToNest, readJsonBody, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { noQuery, updateProfileBody } from "@/lib/bff-schemas";

/**
 * `GET /api/me` → `GET /api/v1/users/me`.
 *
 * **Session required.** The upstream operation carries no `@Public()` and no
 * `@PublicOperation()` — `UsersController.getMe` is declared under the
 * `/* ----- self (auth required) ----- *\/` block (`users.controller.ts:50-56`)
 * and resolves the subject with `@CurrentUser()`, so the global `JwtAuthGuard`
 * is deny-by-default here. A signed-out caller is a 401 from this route rather
 * than a forwarded anonymous request that Nest would reject anyway.
 *
 * **The subject is the token `sub` and nothing else (Hard Rule 1).** Nest reads
 * `caller.sub` from the verified ADR-017 bearer and ignores every request
 * parameter — there is no `userId`, `userEmail`, or `email` selector on this
 * operation, and `noQuery` turns any `?…` into a 400 so one cannot be smuggled
 * in. `requireCallerSub` reads only the verified Auth.js session's `user.id`.
 *
 * Rate class `read:content` — a cheap, single-row projected read.
 *
 * ⚠️ **Known blocker, owned by backend + api-organizer:** `GET /api/v1/users/me`
 * has no response schema in `api/openapi.yaml` (line 3110, `description: ''`
 * with no `content`), so there is no generated type for this route's response.
 * The real shape is `SelfUserProjection` in
 * `api/src/modules/users/user-projection.ts` — an explicitly enumerated,
 * secret-free projection (`password`, `resetToken`, `confirmationToken`, and
 * their expiries are excluded by construction, DEV-034). The route deliberately
 * relays the body untyped, exactly like every other adapter in this surface,
 * because `docs/types/api.ts` is **generated** and neither this role nor any
 * other may hand-write the missing type (Rule 2 / G4). Resolution belongs to the
 * `@ApiOkResponse` decorator the backend is adding, followed by the api-organizer
 * regenerating the spec and the types.
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/users/me",
      sub,
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}

/** `PATCH /api/me` → `PATCH /api/v1/users/me` (self-service profile edit). */
export async function PATCH(request: Request) {
  return runBff("write:engagement", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(updateProfileBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/users/me",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}

/** `DELETE /api/me` → `DELETE /api/v1/users/me` (account self-deletion). */
export async function DELETE(request: Request) {
  return runBff("write:engagement", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "DELETE",
      path: "/users/me",
      sub,
    });
    return NextResponse.json(body, { status });
  });
}
