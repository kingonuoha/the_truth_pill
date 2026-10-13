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
import { aiProviderModelBody } from "@/lib/bff-schemas";

/**
 * `POST /api/admin/ai/shuffle-topics` → `POST /api/v1/ai-actions/shuffle-topics`.
 * Admin, billed. Key read server-side (DEV-053).
 */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(aiProviderModelBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/ai-actions/shuffle-topics",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
