"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Id } from "@/convex/_generated/dataModel";
import { DynamicCategoryImage } from "@/components/dynamic-category-image";

interface Category {
    _id: Id<"categories">;
    name: string;
    slug: string;
    description?: string;
    coverImage?: string;
    articleCount: number;
}

export default function CategoriesPage() {
    const categories = useQuery(api.categories.listAll);

    if (categories === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-[#f8f9fa] min-h-screen font-sans">
            <Navbar solid />
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">Reality Navigator</span>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8">Choose Your Path</h1>
                        <p className="text-zinc-500 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                            Every dimension of human consciousness explored through deep inquiry and unfiltered observation.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {categories.map((category) => (
                            <CategoryCard key={category._id} category={category} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function CategoryCard({ category }: { category: Category }) {
    return (
        <Link
            href={`/categories/${category.slug}`}
            className="group relative h-[450px] rounded-[48px] overflow-hidden shadow-xl shadow-zinc-200/50 hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-700"
        >
            <DynamicCategoryImage
                categoryName={category.name}
                alt={category.name}
                className="transition-transform duration-[2000ms] group-hover:scale-125"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />

            <div className="absolute inset-0 p-10 flex flex-col justify-end">
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-10 h-[2px] bg-primary group-hover:w-16 transition-all duration-700" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
                        {category.articleCount || 0} Articles
                    </span>
                </div>
                <h3 className="text-4xl font-serif font-bold text-white mb-6 group-hover:translate-x-2 transition-transform duration-700">
                    {category.name}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-8 line-clamp-2 opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700 delay-100">
                    {category.description || "Uncovering the hidden dimensions of this reality and the patterns that define it."}
                </p>
                <div className="flex items-center gap-3 text-white text-[11px] font-black uppercase tracking-[0.2em] translate-y-6 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200">
                    Explore Reality <ArrowRight size={18} className="text-primary group-hover:translate-x-3 transition-transform" />
                </div>
            </div>
        </Link>
    );
}
