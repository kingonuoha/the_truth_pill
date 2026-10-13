"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { UAParser } from "ua-parser-js";
import { getVisitorId } from "@/lib/analytics";
import { bffFetch } from "@/lib/bff-client";

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Skip tracking for admin and dashboard pages
        if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
            return;
        }

        const visitorId = getVisitorId();
        const url = window.location.href;
        const referrer = document.referrer;

        // The BFF (`/api/analytics/pageview`) derives the IP server-side from the
        // validated `x-forwarded-for` and validates the body strictly (DEV-024).
        const parser = new UAParser(navigator.userAgent);
        const result = parser.getResult();

        bffFetch("/api/analytics/pageview", {
            method: "POST",
            body: {
                visitorId,
                url,
                device: result.device.type || "desktop",
                browser: result.browser.name || "Unknown",
                os: result.os.name || "Unknown",
                referrer: referrer || undefined,
            },
        }).catch((error) => console.error("Failed to track visit:", error));
    }, [pathname, searchParams]);

    return null;
}
