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
import { bulkArticleIdsBody } from "@/lib/bff-schemas";

/** `POST /api/admin/articles/bulk-restore` → `POST /api/v1/articles/bulk-restore`. Admin. */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(bulkArticleIdsBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/articles/bulk-restore",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
