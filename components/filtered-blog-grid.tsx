"use client";

import { BlogGrid } from "./blog-grid";
import { Id } from "../convex/_generated/dataModel";
import { usePillars } from "./categories-provider";
import Link from "next/link";

interface FilteredBlogGridProps {
    categoryId: Id<"categories">;
    pillar?: string;
}

export function FilteredBlogGrid({ categoryId, pillar }: FilteredBlogGridProps) {
    const pillars = (usePillars() || []).filter(p => p.categoryId === categoryId);

    return (
        <div className="w-full flex flex-col gap-8">
            {/* Pillars Navigation UI */}
            {pillars && pillars.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap gap-2">
                        {pillars.map((p) => (
                            <Link
                                key={p._id}
                                href={`/pillars/${p.slug}`}
                                className="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 border border-transparent hover:border-zinc-900 dark:hover:border-white"
                            >
                                {p.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Blog Grid */}
            <BlogGrid 
                categoryId={categoryId} 
                pillar={pillar} 
            />
        </div>
    );
}
