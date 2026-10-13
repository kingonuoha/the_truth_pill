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
import { emailIdBody } from "@/lib/bff-schemas";

/** `POST /api/admin/emails/retry` → `POST /api/v1/emails/retry-email`. Admin. */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(emailIdBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/emails/retry-email",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
