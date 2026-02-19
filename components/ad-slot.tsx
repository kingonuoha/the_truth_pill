"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

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
    const adsSettings = useQuery(api.ads.getAdsSettings);

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
