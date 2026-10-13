import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

/**
 * UX redirection only — **not** a security boundary (brief §2 prohibition 3,
 * DEV-032). It sends a signed-out visitor to the sign-in page instead of
 * showing an empty admin/dashboard shell. Authorization is enforced by the Nest
 * API, which reads the role from the `users` row and rejects an unauthorised
 * request independently of whether it arrived through a matched path.
 *
 * No role claim is consulted here. A role cached in the session is a display
 * convenience; treating it as the gate is the defect this file no longer
 * commits.
 *
 * ⚠️ Edge-safe by construction. This file MUST import `@/auth.config` (the
 * Edge slice) and never `@/auth` — the full config pulls in `lib/api-token.ts`
 * and therefore `node:crypto`, which the Edge Runtime cannot resolve
 * (P10-QA-001). That import path is what crashed every matched request.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isGated =
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/dashboard");

  if (isGated && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
