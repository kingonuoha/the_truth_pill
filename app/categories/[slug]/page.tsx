"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/navbar";
import { BlogGrid } from "@/components/blog-grid";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const category = useQuery(api.categories.getBySlug, { slug });

    if (category === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (category === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-serif font-bold mb-4">Reality Not Found</h1>
                <p className="text-zinc-500 max-w-md">This dimension of truth does not exist or has been shifted elsewhere.</p>
            </div>
        );
    }

    // Fallback images based on slug
    const fallbackImageMap: Record<string, string> = {
        "psychology": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=2070&auto=format&fit=crop",
        "philosophy": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop",
        "society": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=2070&auto=format&fit=crop",
        "default": "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=1200"
    };

    const headerImage = category.coverImage || fallbackImageMap[category.slug] || fallbackImageMap.default;

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            {/* Category Header */}
            <header className="relative w-full h-[60vh] flex items-center justify-center text-center px-6 overflow-hidden">
                <Image
                    src={headerImage}
                    alt={category.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[2px]" />

                <div className="relative z-10 max-w-4xl">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-sky-blue text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                        Reality Dimension
                    </div>
                    <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 uppercase tracking-tight">
                        {category.name}
                    </h1>
                    <p className="text-white/80 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        {category.description || `Exploring the depth of ${category.name.toLowerCase()} and the underlying patterns of existence.`}
                    </p>
                </div>
            </header>

            {/* Main Content Sections */}
            <section className="bg-white">
                <div className="max-w-7xl mx-auto pt-24 px-6">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-12 h-1 bg-sky-blue rounded-full" />
                        <h2 className="text-2xl md:text-3xl font-serif font-bold">Insights into {category.name}</h2>
                    </div>
                </div>
                <BlogGrid categoryId={category._id} />
            </section>
        </main>
    );
}
