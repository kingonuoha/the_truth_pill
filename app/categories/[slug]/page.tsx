"use client";

import { Navbar } from "@/components/navbar";
import { BlogGrid } from "@/components/blog-grid";
import Image from "next/image";

import { use } from "react";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);

    // Mapping slugs to display names for mock
    const categoryName = slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Category Header */}
            <header className="relative w-full h-[50vh] bg-zinc-900 flex items-center justify-center text-center px-6 overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=1200"
                    alt={categoryName}
                    fill
                    className="object-cover opacity-40"
                />
                <div className="relative z-10 max-w-4xl">
                    <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4">Sentiment Collection</p>
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 uppercase tracking-tight">
                        {categoryName}
                    </h1>
                    <p className="text-white/70 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
                        Exploring the depth of {categoryName.toLowerCase()} and how it shapes our daily existence and long-term peace.
                    </p>
                </div>
            </header>

            {/* Main Content Sections */}
            <section className="bg-white">
                <div className="max-w-7xl mx-auto pt-20 px-6">
                    <h2 className="text-2xl font-serif font-bold mb-2">Reflections on {categoryName}</h2>
                    <div className="w-12 h-1 bg-primary mb-10" />
                </div>
                <BlogGrid />
            </section>

            {/* Footer */}
            <footer className="bg-zinc-50 border-t py-20 px-6 mt-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex flex-col gap-4 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">T</div>
                            <span className="font-serif text-2xl font-bold">The Truth Pill</span>
                        </div>
                        <p className="text-zinc-500 max-w-sm text-sm">
                            Helping you live a full life and become a better human to yourself and everyone around you.
                        </p>
                    </div>

                    <div className="flex gap-10 text-sm font-medium">
                        <div className="flex flex-col gap-3">
                            <h4 className="font-bold">Platform</h4>
                            <a href="#" className="text-zinc-500 hover:text-primary transition-colors">Articles</a>
                            <a href="#" className="text-zinc-500 hover:text-primary transition-colors">Categories</a>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
