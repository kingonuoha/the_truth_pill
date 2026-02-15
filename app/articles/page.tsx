"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/navbar";
import { BlogSkeleton } from "@/components/skeletons";
import { BlogGrid } from "@/components/blog-grid";
import { motion } from "framer-motion";

export default function ArticlesPage() {
    const articles = useQuery(api.articles.list, { limit: 100 });

    return (
        <div className="bg-white min-h-screen">
            <Navbar solid />
            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">The Archive</span>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 italic">Library of Insights</h1>
                        <p className="text-zinc-500 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                            A comprehensive collection of psychological deep-dives, cultural observations, and philosophical inquiries.
                        </p>
                    </motion.div>
                </div>

                {articles === undefined ? (
                    <BlogSkeleton />
                ) : (
                    <div className="animate-in fade-in duration-1000">
                        <BlogGrid />
                    </div>
                )}
            </main>
        </div>
    );
}
