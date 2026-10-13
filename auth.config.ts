import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe slice of the Auth.js configuration.
 *
 * Next.js middleware runs on the Edge Runtime, which cannot resolve Node-only
 * built-ins such as `node:crypto`. The full config in `auth.ts` imports
 * `lib/api-token.ts` (it mints the ADR-017 token with `node:crypto`), so
 * `middleware.ts` must never transitively reach that module. Only the pieces
 * middleware can bundle for the Edge live here: the Google provider, the
 * sign-in route, and the session shape. `auth.ts` spreads this object and adds
 * the Node-only Credentials provider and its callbacks.
 *
 * Keep this file free of `api-token`, `node:*`, and any other server-only
 * module. `middleware.ts` imports it directly, not `auth.ts`.
 */
const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig;

export default authConfig;
