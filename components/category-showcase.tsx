"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import { CategorySkeleton } from "./skeletons";
import { DynamicCategoryImage } from "./dynamic-category-image";

interface CategoryWithCount extends Doc<"categories"> {
    articleCount: number;
}

export function CategoryShowcase() {
    const categories = useQuery(api.categories.listAll) as CategoryWithCount[] | undefined;

    if (categories === undefined) {
        return <CategorySkeleton />;
    }

    if (!categories || categories.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-10 max-w-7xl mx-auto">
            {categories.map((cat: CategoryWithCount) => (
                <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="group relative h-72 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
                >
                    <DynamicCategoryImage
                        categoryName={cat.name}
                        alt={cat.name}
                        className="transition-transform duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="w-6 h-[1px] bg-sky-blue group-hover:w-10 transition-all duration-500" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-blue">
                                Discover
                            </span>
                        </div>
                        <h3 className="text-white font-serif text-3xl font-bold group-hover:translate-x-2 transition-transform duration-500">
                            {cat.name}
                        </h3>
                        <p className="text-white/60 text-[10px] mt-2 font-bold uppercase tracking-widest">{cat.articleCount} Articles</p>
                    </div>
                </Link>
            ))}
        </div>
    );
}

