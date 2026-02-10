"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthRedirect, clearAuthRedirect } from "@/lib/analytics";
import { useSession } from "next-auth/react";

export function AuthRedirect() {
    const { status } = useSession();
    const isAuthenticated = status === "authenticated";
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            const redirectUrl = getAuthRedirect();
            if (redirectUrl) {
                clearAuthRedirect();
                router.push(redirectUrl);
            }
        }
    }, [isAuthenticated, router]);

    return null;
}
