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
import { removeCategoryBody } from "@/lib/bff-schemas";

/**
 * `PATCH /api/admin/categories/remove` → `PATCH /api/v1/categories/remove`.
 * Admin. Nest is `PATCH`, not `DELETE`: a reference-safe removal that returns a
 * 409 while articles still reference the category (frozen delete guard).
 */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(removeCategoryBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/categories/remove",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
