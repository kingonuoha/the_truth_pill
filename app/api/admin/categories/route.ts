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
import { createCategoryBody, updateCategoryBody } from "@/lib/bff-schemas";

/** `POST /api/admin/categories` → `POST /api/v1/categories/create`. Admin (S-015). */
export async function POST(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(createCategoryBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "POST",
      path: "/categories/create",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}

/** `PATCH /api/admin/categories` → `PATCH /api/v1/categories/update`. Admin. */
export async function PATCH(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const body = parseStrictBody(updateCategoryBody, await readJsonBody(request));
    const { status, body: result } = await proxyToNest({
      method: "PATCH",
      path: "/categories/update",
      sub,
      body,
    });
    return NextResponse.json(result, { status });
  });
}
