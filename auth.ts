import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import { nestApiBaseUrl } from "./lib/api-token";

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
        try {
          const response = await fetch(
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
          return response.ok;
        } catch {
          return false;
        }
      }
      return true;
    },
    // The Postgres id is carried on the session for display and for the
    // server-side token mint. NextAuth stores the user id on `token.sub`; the
    // role is deliberately NOT read from a claim for authorization (DEV-032) —
    // the API resolves it from the DB.
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
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
