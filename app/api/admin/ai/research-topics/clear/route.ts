import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";

/** `PATCH /api/admin/ai/research-topics/clear` → `PATCH /api/v1/ai/clear-all-pending-topics`. Admin. */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "PATCH",
      path: "/ai/clear-all-pending-topics",
      sub,
    });
    return NextResponse.json(body, { status });
  });
}
