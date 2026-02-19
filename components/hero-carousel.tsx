"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { JoinedArticle } from "./blog-grid";

export function HeroCarousel({ initialArticles }: { initialArticles?: JoinedArticle[] }) {
    const featuredArticles = useQuery(api.articles.getFeatured, { limit: 5 }) as JoinedArticle[] | undefined || initialArticles;
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(0);

    const next = useCallback(() => {
        if (!featuredArticles) return;
        setDirection(1);
        setCurrent((prevIdx) => (prevIdx + 1) % featuredArticles.length);
    }, [featuredArticles]);

    const prev = useCallback(() => {
        if (!featuredArticles) return;
        setDirection(-1);
        setCurrent((prevIdx) => (prevIdx - 1 + featuredArticles.length) % featuredArticles.length);
    }, [featuredArticles]);

    useEffect(() => {
        if (!featuredArticles || featuredArticles.length <= 1) return;
        const timer = setInterval(next, 8000);
        return () => clearInterval(timer);
    }, [featuredArticles, next]);

    if (featuredArticles === undefined) {
        return (
            <div className="h-[90vh] w-full flex items-center justify-center bg-gray-950">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin opacity-50" />
            </div>
        );
    }

    if (!featuredArticles || featuredArticles.length === 0) {
        return null;
    }

    const currentItem = featuredArticles[current];

    const variants = {
        enter: () => ({
            opacity: 0,
            scale: 1.1
        }),
        center: {
            opacity: 1,
            scale: 1
        },
        exit: () => ({
            opacity: 0,
            scale: 0.95
        })
    };

    return (
        <div className="relative h-[85vh] md:h-[90vh] w-full overflow-hidden bg-gray-950">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={current}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        opacity: { duration: 0.8, ease: "easeInOut" },
                        scale: { duration: 8, ease: "linear" }
                    }}
                    className="absolute inset-0"
                >
                    <Image
                        src={currentItem.coverImage || ""}
                        alt={currentItem.title}
                        fill
                        priority
                        className="object-cover opacity-60"
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/70 to-transparent" />
                </motion.div>
            </AnimatePresence>

            <div className="relative h-full flex items-center max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
                <div className="max-w-2xl text-left">
                    <motion.div
                        key={`badge-${current}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Featured Truth
                    </motion.div>

                    <motion.h1
                        key={`title-${current}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-5xl lg:text-7xl font-serif font-extrabold text-white mb-6 leading-[1.1] tracking-tight"
                    >
                        {currentItem.title}
                    </motion.h1>

                    <motion.p
                        key={`excerpt-${current}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl font-medium leading-relaxed"
                    >
                        {currentItem.excerpt}
                    </motion.p>

                    <motion.div
                        key={`actions-${current}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap gap-4"
                    >
                        <Link
                            href={`/articles/${currentItem.slug}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest"
                        >
                            Read Article
                        </Link>
                        <Link
                            href="/articles"
                            className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white font-bold py-4 px-10 rounded-full transition-all active:scale-95 text-xs uppercase tracking-widest"
                        >
                            Explore Feed
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Progress Dots */}
            <div className="absolute bottom-10 right-10 flex gap-2">
                {featuredArticles.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setDirection(idx > current ? 1 : -1);
                            setCurrent(idx);
                        }}
                        className={cn(
                            "h-1 transition-all duration-300 rounded-full",
                            current === idx ? "bg-blue-600 w-12" : "bg-white/20 w-4"
                        )}
                    />
                ))}
            </div>

            {/* Swipe Controls (Desktop) */}
            <div className="absolute bottom-10 left-10 flex gap-4">
                <button
                    onClick={prev}
                    className="p-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition-all active:scale-90"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={next}
                    className="p-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition-all active:scale-90"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
    return inputs.filter(Boolean).join(" ");
}
