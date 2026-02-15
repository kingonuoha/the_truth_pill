"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("animate-pulse bg-zinc-100 rounded-md", className)} />
    );
}

export function BlogSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col gap-5">
                        <Skeleton className="w-full aspect-[4/3] rounded-3xl" />
                        <div className="flex flex-col gap-3 px-1">
                            <Skeleton className="h-8 w-3/4 rounded-xl" />
                            <Skeleton className="h-4 w-full rounded-lg" />
                            <Skeleton className="h-4 w-2/3 rounded-lg" />
                        </div>
                        <Skeleton className="h-16 w-full rounded-2xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function CategorySkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[16/10] rounded-[2.5rem] overflow-hidden">
                    <Skeleton className="w-full h-full" />
                </div>
            ))}
        </div>
    );
}

export function ArticleSkeleton() {
    return (
        <div className="w-full">
            <Skeleton className="w-full h-[70vh]" />
            <div className="max-w-4xl mx-auto px-6 py-20 space-y-8">
                <Skeleton className="h-12 w-3/4 rounded-2xl" />
                <div className="flex gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <div className="space-y-4 pt-10">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/6" />
                </div>
            </div>
        </div>
    );
}
