"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Id } from "@/convex/_generated/dataModel";

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
        <>
            <Navbar />
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">Explore by Reality</h1>
                        <p className="text-zinc-500 text-lg max-w-2xl font-medium">
                            Navigate through our curated collections of insights, patterns, and truths. Each category is a gateway to a deeper understanding of the world.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((category) => (
                            <CategoryCard key={category._id} category={category} />
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}

function CategoryCard({ category }: { category: Category }) {
    // Dynamic image fallback if coverImage is not provided
    const fallbackImageMap: Record<string, string> = {
        "psychology": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=2070&auto=format&fit=crop",
        "philosophy": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop",
        "society": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=2070&auto=format&fit=crop",
        "default": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2070&auto=format&fit=crop"
    };

    const imageUrl = category.coverImage || fallbackImageMap[category.slug] || fallbackImageMap.default;

    return (
        <Link
            href={`/categories/${category.slug}`}
            className="group relative h-[400px] rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
        >
            <Image
                src={imageUrl}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-[1px] bg-sky-blue group-hover:w-12 transition-all" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-blue">
                        {category.articleCount || 0} Articles
                    </span>
                </div>
                <h3 className="text-3xl font-serif font-bold text-white mb-4 group-hover:translate-x-2 transition-transform duration-500">
                    {category.name}
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed mb-6 line-clamp-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                    {category.description || "Uncovering the hidden dimensions of this reality."}
                </p>
                <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                    Browse Category <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
            </div>
        </Link>
    );
}
