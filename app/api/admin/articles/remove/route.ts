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
import { articleByIdQuery } from "@/lib/bff-schemas";

/** `PATCH /api/admin/articles/remove` → `PATCH /api/v1/articles/remove` (archive). Admin. */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(articleByIdQuery, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/articles/remove",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
