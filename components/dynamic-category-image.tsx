"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface DynamicCategoryProps {
    categoryName: string;
    categoryId?: Id<"categories">;
    coverImage?: string;
    pexelsImages?: string[];
    alt: string;
    className?: string;
}

export function DynamicCategoryImage({ 
    categoryName, 
    categoryId, 
    coverImage,
    pexelsImages, 
    alt, 
    className 
}: DynamicCategoryProps) {
    const [imageUrl, setImageUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const updateCategory = useMutation(api.categories.update);

    // Pick a random image from the list if available, but keep it stable for this mount
    // Priority: 1. coverImage (Selected by Admin) 2. item from pexelsImages 3. New fetch
    const stableRandomImage = useMemo(() => {
        if (coverImage) return coverImage;
        if (pexelsImages && pexelsImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * pexelsImages.length);
            return pexelsImages[randomIndex];
        }
        return null;
    }, [coverImage, pexelsImages]);

    useEffect(() => {
        async function loadImage() {
            if (stableRandomImage) {
                setImageUrl(stableRandomImage);
                setIsLoading(false);
                return;
            }

            try {
                const { fetchCategoryImages } = await import("@/app/actions/pexels");
                const urls = await fetchCategoryImages(categoryName);
                
                if (urls && urls.length > 0) {
                    setImageUrl(urls[0]);
                    
                    // Save to DB if we have categoryId
                    if (categoryId) {
                        try {
                            await updateCategory({
                                id: categoryId,
                                pexelsImages: urls
                            });
                        } catch (err) {
                            console.error("Failed to save pexels images to DB", err);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load pexels image", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadImage();
    }, [categoryName, categoryId, stableRandomImage, updateCategory]);

    return (
        <div className={cn("relative w-full h-full overflow-hidden bg-gray-900 group/category flex items-center justify-center text-center px-4", className)}>
            {/* Premium Fallback - Interactive Blue Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(59,130,246,0.3)_0%,_transparent_60%)] z-0" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,0.8)_100%)] z-[-1]" />
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0 mix-blend-overlay" />

            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={alt}
                    fill
                    className={cn(
                        "object-cover transition-all duration-1000 group-hover/category:scale-110",
                        isLoading ? "opacity-0" : "opacity-100"
                    ) as string}
                />
            ) : (
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-1 bg-blue-500 mb-4 rounded-full" />
                    <span className="text-xl md:text-2xl font-serif font-black text-white/90 tracking-tight leading-tight italic">
                        {categoryName}
                    </span>
                    <div className="mt-2 text-[8px] font-black uppercase tracking-[0.4em] text-blue-400 opacity-60">
                        The Truth Pill
                    </div>
                </div>
            )}
            
            {/* Adaptive Overlay for text readability (only if image exists) */}
            {imageUrl && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-60" />
                    <div className="absolute inset-0 bg-black/10 transition-opacity group-hover/category:opacity-30" />
                </>
            )}
        </div>
    );
}
