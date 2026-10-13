import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  callerSub,
  parseStrictQuery,
  proxyToNest,
  requireCallerSub,
} from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { emailIdQuery, emailLogsQuery } from "@/lib/bff-schemas";

/** `GET /api/admin/emails?limit=` → `GET /api/v1/emails/email-logs`. Admin. */
export async function GET(request: Request) {
  return runBff("read:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(emailLogsQuery, new URL(request.url).searchParams);
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/emails/email-logs",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}

/** `DELETE /api/admin/emails?id=` → `DELETE /api/v1/emails/delete-email?id=`. Admin. */
export async function DELETE(request: Request) {
  return runBff("write:admin", request, async () => {
    const session = await auth();
    const sub = requireCallerSub(callerSub(session?.user?.id));
    const query = parseStrictQuery(emailIdQuery, new URL(request.url).searchParams);
    const { status, body } = await proxyToNest({
      method: "DELETE",
      path: "/emails/delete-email",
      sub,
      query,
    });
    return NextResponse.json(body, { status });
  });
}
