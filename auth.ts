import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { api } from "./convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await fetchQuery(api.users.currentUser, {
          email: credentials.email as string,
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!isValid) return null;

        return {
          id: user._id,
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
        try {
          // Store user in Convex
          await fetchMutation(api.users.store, {
            name: user.name ?? "Unknown",
            email: user.email ?? "",
            profileImage: user.image ?? undefined,
            provider: "google",
            // Note: visitorId will be linked on the client side via a mutation if possible
          });
          return true;
        } catch (error) {
          console.error("Error saving user to Convex:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      if (token.email) {
        try {
          // Fetch user details from Convex to get the role
          const { fetchQuery } = await import("convex/nextjs");
          const dbUser = await fetchQuery(api.users.currentUser, {
            email: token.email,
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.userId = dbUser._id;
          }
        } catch (error) {
          console.error("Error fetching user for JWT:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "admin" | "user";
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
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
}
