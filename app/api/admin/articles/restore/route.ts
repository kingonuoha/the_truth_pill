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

/** `POST /api/admin/articles/restore` → `POST /api/v1/articles/restore`. Admin. */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(articleByIdQuery, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/articles/restore",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
