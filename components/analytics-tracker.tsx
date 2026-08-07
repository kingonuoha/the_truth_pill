"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getVisitorId } from "@/lib/analytics";
import { trackVisit } from "@/app/actions/analytics";

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

        trackVisit({
            visitorId,
            url,
            referrer,
        });
    }, [pathname, searchParams]);

    return null;
}
