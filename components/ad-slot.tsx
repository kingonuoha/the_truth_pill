"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { bffFetch } from "@/lib/bff-client";
import type { AdsSettings } from "@/lib/content-types";

type AdPosition =
    | 'showAdTopOfArticle'
    | 'showAdMiddleOfArticle'
    | 'showAdBottomOfArticle'
    | 'showAdSidebar';

interface AdSlotProps {
    position: AdPosition;
    className?: string;
}

export function AdSlot({ position, className }: AdSlotProps) {
    const [adsSettings, setAdsSettings] = useState<AdsSettings | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await bffFetch<AdsSettings>("/api/ads-settings");
                if (!cancelled) setAdsSettings(data);
            } catch {
                // Leave null — no slot is rendered, same as an absent/failed read.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!adsSettings?.adsEnabled || !adsSettings[position] || !adsSettings.adsenseAdUnitCode) {
        return null;
    }

    return (
        <div
            className={cn(
                "w-full flex justify-center py-4",
                className
            )}
        >
            <div
                className="w-full max-w-[728px] overflow-hidden rounded-md"
                dangerouslySetInnerHTML={{ __html: adsSettings.adsenseAdUnitCode }}
            />
        </div>
    );
}
