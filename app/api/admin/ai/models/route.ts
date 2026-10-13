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
import { aiFetchModelsBody } from "@/lib/bff-schemas";

/**
 * `POST /api/admin/ai/models` → `POST /api/v1/ai-actions/models`. Admin, billed.
 * A transient `apiKey` is accepted and never echoed (DEV-053); Nest throttles.
 */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(aiFetchModelsBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/ai-actions/models",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
