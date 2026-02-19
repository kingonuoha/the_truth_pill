"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Script from "next/script";

export function AdSenseScript() {
    const adsSettings = useQuery(api.ads.getAdsSettings);

    if (!adsSettings?.adsEnabled || !adsSettings?.adsenseScriptCode) {
        return null;
    }

    // Extract the src from the script tag if provided as a full tag
    const match = adsSettings.adsenseScriptCode.match(/src="([^"]+)"/);
    const scriptUrl = match ? match[1] : null;

    if (!scriptUrl) {
        return null;
    }

    return (
        <Script
            async
            src={scriptUrl}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}
