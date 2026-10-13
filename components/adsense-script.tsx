"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { bffFetch } from "@/lib/bff-client";
import type { AdsSettings } from "@/lib/content-types";

export function AdSenseScript() {
    const [adsSettings, setAdsSettings] = useState<AdsSettings | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await bffFetch<AdsSettings>("/api/ads-settings");
                if (!cancelled) setAdsSettings(data);
            } catch {
                // Leave null — no script is injected.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!adsSettings?.adsEnabled || !adsSettings.adsenseScriptCode) {
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
