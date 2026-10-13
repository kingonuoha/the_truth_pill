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
import { aiTestConnectionBody } from "@/lib/bff-schemas";

/** `POST /api/admin/ai/test-connection` → `POST /api/v1/ai-actions/test-connection`. Admin, billed. */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(aiTestConnectionBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/ai-actions/test-connection",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
