"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

import { SessionProvider } from "next-auth/react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ConvexProvider client={convex}>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                    {children}
                </ThemeProvider>
            </ConvexProvider>
        </SessionProvider>
    );
}
