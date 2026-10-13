"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                {children}
                <ProgressBar
                    height="4px"
                    color="#3b82f6"
                    options={{ showSpinner: true }}
                    shallowRouting={false}
                />
            </ThemeProvider>
        </SessionProvider>
    );
}
