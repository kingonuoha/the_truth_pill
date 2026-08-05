"use client";

import Link from "next/link";
import { CategorySkeleton } from "./skeletons";
import { DynamicCategoryImage } from "./dynamic-category-image";
import { useCategories, CategorySummary } from "./categories-provider";

export function CategoryShowcase() {
    const categories = useCategories() as CategorySummary[] | undefined;

    if (categories === undefined) {
        return <CategorySkeleton />;
    }

    if (!categories || categories.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat: CategorySummary) => (
                <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="group relative h-80 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-blue-500/20"
                >
                    <DynamicCategoryImage
                        categoryName={cat.name}
                        categoryId={cat._id}
                        coverImage={cat.coverImage}
                        pexelsImages={cat.pexelsImages}
                        alt={cat.name}
                        className="transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="w-6 h-[1px] bg-blue-500 group-hover:w-10 transition-all duration-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                Explore
                            </span>
                        </div>
                        <h3 className="text-white font-serif text-2xl font-black group-hover:translate-x-1 transition-transform duration-500">
                            {cat.name}
                        </h3>
                        <p className="text-gray-400 text-[10px] mt-2 font-bold uppercase tracking-widest leading-none">
                            {cat.articleCount} Articles
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}

