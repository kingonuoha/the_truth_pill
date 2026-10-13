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
 * `POST /api/admin/ai/learn-author-style` → `POST /api/v1/ai-actions/learn-author-style`.
 * Admin, billed. The provider key is read server-side; a body `apiKey` is a 400.
 */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(aiProviderModelBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/ai-actions/learn-author-style",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
