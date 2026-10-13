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
import {
  adminArticlesQuery,
  createArticleBody,
  updateArticleBody,
} from "@/lib/bff-schemas";

/** `GET /api/admin/articles?page=&pageSize=&…` → `GET /api/v1/articles/admin`. Admin. */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(
      adminArticlesQuery,
      new URL(request.url).searchParams,
    );
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/articles/admin",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}

/**
 * `POST /api/admin/articles` → `POST /api/v1/articles/create`. Admin.
 *
 * Authorship is the verified token `sub`; `adminEmail` / `authorId` are unknown
 * keys and a 400 (DEV-029/030).
 */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(createArticleBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/articles/create",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}

/**
 * `PATCH /api/admin/articles` → `PATCH /api/v1/articles/update`. Admin.
 *
 * `authorId` is not rewritten through update (DEV-030); the field is a 400.
 */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(updateArticleBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/articles/update",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
