import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import { parseStoredUserId } from "./lib/auth-identity";
import { toSessionRole, type SessionRole } from "./lib/auth-role";
import { mintApiToken, nestApiBaseUrl } from "./lib/api-token";

/**
 * Auth.js v5 is the only human login. Per ADR-017 (Option 1) it now delegates
 * the credential ceremony to the Nest API instead of reading Convex:
 * `authorize()` calls `POST /api/v1/auth/login`, and the Google `signIn`
 * callback upserts through the internal users route. The Nest API verifies the
 * resulting identity with the ADR-017 API token, minted server-side in
 * `lib/api-token.ts`.
 *
 * ⚠️ The role-claim authorization path (DEV-032) is retired from the security
 * path. The role is resolved by the API from the `users` row on every request;
 * `middleware.ts` is UX redirection only. A role kept in the web session is a
 * display convenience at most.
 */

interface LoginUser {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Runtime-validate the Nest login response — no `any`, no blind cast. */
function parseLoginUser(value: unknown): LoginUser | null {
  if (!isRecord(value)) return null;
  const { id, email, name, role } = value;
  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof email !== "string" || email.length === 0) return null;
  if (name !== null && typeof name !== "string") return null;
  const normalisedRole = role === "admin" ? "admin" : "user";
  return { id, email, name: name ?? null, role: normalisedRole };
}

/**
 * Ask the API for the caller's display role, using the ADR-017 bearer minted
 * from the verified `sub`.
 *
 * Used only by the Google sign-in path, and only once, at sign-in. An OAuth
 * profile carries no role and the upsert returns only the row id, so the DB is
 * the only honest source. This mirrors what the credential path already gets
 * for free: `POST /auth/login` returns the caller's own projection, role
 * included.
 *
 * Fails closed to `"user"`. A sign-in must never fail because a *display*
 * lookup did — the upsert above is the gate, and the API remains the sole
 * authority on what this session may actually do (DEV-032).
 */
async function resolveDisplayRole(sub: string): Promise<SessionRole> {
  try {
    const { token } = mintApiToken(sub);
    const response = await fetch(`${nestApiBaseUrl()}/api/v1/users/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      // Argument-free on purpose: the only thing worth recording is that the
      // lookup failed. No subject, and never a credential.
      console.warn("[auth] display role lookup failed");
      return "user";
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      console.warn("[auth] display role lookup returned an unreadable body");
      return "user";
    }
    return toSessionRole(isRecord(payload) ? payload.role : undefined);
  } catch {
    console.warn("[auth] display role lookup failed");
    return "user";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        let response: Response;
        try {
          response = await fetch(`${nestApiBaseUrl()}/api/v1/auth/login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
        } catch {
          return null;
        }
        if (!response.ok) return null;

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          return null;
        }
        const user = isRecord(payload) ? parseLoginUser(payload.user) : null;
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const secret = process.env.INTERNAL_JOB_SECRET;
        if (typeof secret !== "string" || secret.length === 0) return false;

        let response: Response;
        try {
          response = await fetch(
            `${nestApiBaseUrl()}/api/v1/internal/users/store`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-internal-secret": secret,
              },
              body: JSON.stringify({
                name: user.name ?? "Unknown",
                email: user.email ?? "",
                profileImage: user.image ?? undefined,
              }),
            },
          );
        } catch {
          return false;
        }
        if (!response.ok) return false;

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          return false;
        }

        // The upserted Postgres id must become the session subject. `@auth/core`
        // hands the OAuth path a random UUID, not the provider subject, so an id
        // taken from `user` is one no `users` row matches — every BFF call would
        // present it and Nest would answer `401 Unknown subject`.
        const storedId = parseStoredUserId(payload);
        if (storedId === null) return false;
        user.id = storedId;

        // Display-only. Resolved once here, at sign-in, from the DB — the OAuth
        // profile carries no role and the upsert returns only the id. A failure
        // leaves the caller as "user" and never blocks a sign-in that the upsert
        // above already authorised. Authorization is unaffected either way:
        // Nest re-reads `users.role` per request (DEV-032).
        user.role = await resolveDisplayRole(storedId);
        return true;
      }
      return true;
    },
    // The Postgres id is carried on the session for display and for the
    // server-side token mint. NextAuth stores the user id on `token.sub`; the
    // role is deliberately NOT read from a claim for authorization (DEV-032) —
    // the API resolves it from the DB.
    //
    // ⚠️ The role *is* copied onto the token, but only so the navigation shell
    // can tell an admin from a member. Nest re-reads `users.role` on every
    // request, so a stale claim grants nothing. Before this was written the
    // claim was never populated, so `session.user.role` was `undefined` and
    // every admin was rendered the member shell — no link into `/admin`, and
    // therefore no way to reach the admin sidebar or the editor. See
    // `lib/auth-role.ts`.
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      // `user` is only present on the sign-in pass; the value then lives in the
      // JWT cookie for the life of the session.
      if (user) {
        token.role = toSessionRole(user.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        session.user.role = toSessionRole(token.role);
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "admin" | "user";
    };
  }
  interface User {
    role?: "admin" | "user";
  }
}
