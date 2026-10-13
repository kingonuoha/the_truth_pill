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
import { removePillarBody } from "@/lib/bff-schemas";

/**
 * `PATCH /api/admin/pillars/remove` → `PATCH /api/v1/pillars/remove`. Admin.
 * Nest is `PATCH`, not `DELETE`; a 409 is returned while articles still link.
 */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(removePillarBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/pillars/remove",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
