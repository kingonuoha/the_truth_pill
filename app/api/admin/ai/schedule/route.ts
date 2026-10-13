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
import { aiIdQuery, aiScheduleBody, noQuery } from "@/lib/bff-schemas";

/** `GET /api/admin/ai/schedule` → `GET /api/v1/ai/schedule`. Admin. */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/ai/schedule",
      sub,
      query: parseStrictQuery(noQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}

/** `PATCH /api/admin/ai/schedule` → `PATCH /api/v1/ai/update-schedule-v2`. Admin. */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(aiScheduleBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/ai/update-schedule-v2",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}

/** `DELETE /api/admin/ai/schedule?id=` → `DELETE /api/v1/ai/delete-schedule?id=`. Admin. */
export async function DELETE(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(aiIdQuery, new URL(request.url).searchParams);
    const { status, body } = await proxyToNest({
      method: "DELETE",
      path: "/ai/delete-schedule",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
