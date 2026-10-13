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
import { addCommentBody, articleIdQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/engagement/comment?articleId=…` → `GET /api/v1/engagement/comments`
 * (`@Public()` on Nest).
 *
 * The comment **read** half of this path. Approved comments are public content,
 * so this is anonymous-capable; `articleId` is a content selector, not caller
 * identity (Hard Rule 1). Any other query key is a 400 via the strict schema.
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const query = parseStrictQuery(
      articleIdQuery,
      new URL(request.url).searchParams,
    );
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/engagement/comments",
      sub: callerSub(session?.user?.id),
      query,
    });
    return NextResponse.json(body, { status });
  });
}

/**
 * `POST /api/engagement/comment` → `PATCH /api/v1/engagement/add-comment`.
 *
 * The BFF verb is `POST` because this is an action; the upstream verb is Nest's
 * `PATCH`, which the frozen contract fixed. Session required — the commenter is
 * the token `sub`, never a body field. Content emptiness and the 5 000-character
 * bound are the API's 422; the transport-level shape is enforced here.
 */
export async function POST(request: Request) {
  return runBff("write:engagement", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(addCommentBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/engagement/add-comment",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}