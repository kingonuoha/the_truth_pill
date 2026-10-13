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
import { createPillarBody, updatePillarBody } from "@/lib/bff-schemas";

/** `POST /api/admin/pillars` → `POST /api/v1/pillars/create`. Admin (S-015). */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(createPillarBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/pillars/create",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}

/** `PATCH /api/admin/pillars` → `PATCH /api/v1/pillars/update`. Admin. */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(updatePillarBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/pillars/update",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
