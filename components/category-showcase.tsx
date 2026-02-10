"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Loader2 } from "lucide-react";

export function CategoryShowcase() {
    const categories = useQuery(api.categories.listAll);

    if (categories === undefined) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-sky-blue opacity-50" />
            </div>
        );
    }

    if (!categories || categories.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-10 max-w-7xl mx-auto">
            {categories.map((cat) => (
                <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="group relative h-64 rounded-2xl overflow-hidden"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: cat.coverImage ? `url(${cat.coverImage})` : 'none' }}
                    />
                    {!cat.coverImage && <div className="absolute inset-0 bg-zinc-100" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-sky-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute bottom-6 left-6 z-10">
                        <div className="flex flex-col">
                            <h3 className="text-white font-serif text-2xl font-bold group-hover:translate-x-2 transition-transform duration-300">
                                {cat.name}
                            </h3>
                            <span className="text-white/60 text-xs mt-1 font-medium">{cat.articleCount} Articles</span>
                        </div>
                        <div className="w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-sky-blue to-school-purple transition-all duration-500 mt-2" />
                    </div>
                </Link>
            ))}
        </div>
    );
}

