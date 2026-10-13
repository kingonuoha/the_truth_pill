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
import { aiRunResearchBody } from "@/lib/bff-schemas";

/**
 * `POST /api/admin/ai/run-single-research` → `POST /api/v1/ai/run-single-research`.
 * Admin, billed. Key read server-side (DEV-053/DEV-049).
 */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(aiRunResearchBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/ai/run-single-research",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
