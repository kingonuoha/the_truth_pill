"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface DynamicCategoryProps {
    categoryName: string;
    alt: string;
    className?: string;
}

export function DynamicCategoryImage({ categoryName, alt, className }: DynamicCategoryProps) {
    const [imageUrl, setImageUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadImage() {
            try {
                const url = await fetchCategoryImageByQuery(categoryName);
                if (url) setImageUrl(url);
            } catch (err) {
                console.error("Failed to load pexels image", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadImage();
    }, [categoryName]);

    return (
        <div className={cn("relative w-full h-full overflow-hidden bg-zinc-100", className)}>
            {imageUrl && (
                <Image
                    src={imageUrl}
                    alt={alt}
                    fill
                    className={cn(
                        "object-cover transition-opacity duration-1000",
                        isLoading ? "opacity-0" : "opacity-100"
                    )}
                />
            )}
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-black/20" />
        </div>
    );
}

// Separate function for recursion-free fetching logic
async function fetchCategoryImageByQuery(query: string) {
    // This calls our server action
    const { fetchCategoryImage } = await import("@/app/actions/pexels");
    return await fetchCategoryImage(query);
}
