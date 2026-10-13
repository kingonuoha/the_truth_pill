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
import { aiAddResearchTopicBody, aiIdQuery, noQuery } from "@/lib/bff-schemas";

/** `GET /api/admin/ai/research-topics` → `GET /api/v1/ai/research-topics`. Admin. */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/ai/research-topics",
      sub,
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}

/** `POST /api/admin/ai/research-topics` → `PATCH /api/v1/ai/add-research-topic`. Admin. */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(aiAddResearchTopicBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/ai/add-research-topic",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}

/** `DELETE /api/admin/ai/research-topics?id=` → `DELETE /api/v1/ai/delete-research-topic?id=`. Admin. */
export async function DELETE(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(aiIdQuery, new URL(request.url).searchParams);
    const { status, body } = await proxyToNest({
      method: "DELETE",
      path: "/ai/delete-research-topic",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
