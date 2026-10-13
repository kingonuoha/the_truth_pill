import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  BffError,
  callerSub,
  parseStrictBody,
  proxyToNest,
  readJsonBody,
  requireCallerSub,
} from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { updateUserRoleBody } from "@/lib/bff-schemas";

/**
 * `PATCH /api/admin/users/[id]/role` → `PATCH /api/v1/admin/users/{id}/role`.
 *
 * **The path `id` is the target, never the actor.** The actor is the token `sub`
 * (the verified session's `users.id`) and the *only* other accepted field is
 * `role` — the frozen `updateUserRole` authorized on a caller-supplied
 * `adminEmail`, which is the defect that motivates ADR-007 (Hard Rule 1). A body
 * carrying `adminEmail`, `userEmail`, or `userId` is a 400 here and would be a
 * 400 at the API as well.
 *
 * `id` is validated as a UUID before the outbound call so a malformed target
 * fails locally instead of becoming an upstream path.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { id } = await params;
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
      throw new BffError(400, "INVALID_ID", "Invalid user id");
    }
    const body = parseStrictBody(updateUserRoleBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: `/admin/users/${id}/role`,
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}