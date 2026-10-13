import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { articleByIdQuery } from "@/lib/bff-schemas";

/** `GET /api/admin/articles/by-id?id=` → `GET /api/v1/articles/by-id`. Admin. */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(
      articleByIdQuery,
      new URL(request.url).searchParams,
    );
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/articles/by-id",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
