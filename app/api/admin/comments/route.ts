import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  callerSub,
  parseStrictBody,
  parseStrictQuery,
  proxyToNest,
  readJsonBody,
  requireCallerSub,
} from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { deleteCommentQuery, noQuery, updateCommentStatusBody } from "@/lib/bff-schemas";

/** `GET /api/admin/comments` → `GET /api/v1/engagement/all-comments`. Admin (Nest-enforced). */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/engagement/all-comments",
      sub,
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}

/** `PATCH /api/admin/comments` → `PATCH /api/v1/engagement/update-comment-status`. Admin. */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(updateCommentStatusBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/engagement/update-comment-status",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}

/** `DELETE /api/admin/comments?id=` → `DELETE /api/v1/engagement/delete-comment?id=`. Admin. */
export async function DELETE(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(deleteCommentQuery, new URL(request.url).searchParams);
    const { status, body } = await proxyToNest({
      method: "DELETE",
      path: "/engagement/delete-comment",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
