import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest, requireCallerSub } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { articleByIdQuery } from "@/lib/bff-schemas";

/** `DELETE /api/admin/articles/delete-forever?id=` → `DELETE /api/v1/articles/delete-forever`. Admin. */
export async function DELETE(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(
      articleByIdQuery,
      new URL(request.url).searchParams,
    );
    const { status, body } = await proxyToNest({
      method: "DELETE",
      path: "/articles/delete-forever",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
