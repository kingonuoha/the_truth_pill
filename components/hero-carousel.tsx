"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";

export function HeroCarousel() {
    const featuredArticles = useQuery(api.articles.getFeatured, { limit: 5 });
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
        const timer = setInterval(next, 6000);
        return () => clearInterval(timer);
    }, [featuredArticles, next]);

    if (featuredArticles === undefined) {
        return (
            <div className="h-[95vh] w-full flex items-center justify-center bg-zinc-900">
                <Loader2 className="w-8 h-8 text-white animate-spin opacity-50" />
            </div>
        );
    }

    if (!featuredArticles || featuredArticles.length === 0) {
        return null;
    }

    const currentItem = featuredArticles[current];

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0
        })
    };

    return (
        <div className="relative h-[95vh] w-full overflow-hidden bg-zinc-900">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={current}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.5 }
                    }}
                    className="absolute inset-0"
                >
                    <Image
                        src={currentItem.coverImage || ""}
                        alt={currentItem.title}
                        fill
                        priority={current === 0}
                        className="object-cover transition-transform duration-[10000ms] scale-105 opacity-60"
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                </motion.div>
            </AnimatePresence>

            <div className="relative h-full flex items-center px-10 md:px-20 lg:px-32">
                <div className="max-w-3xl text-left">
                    <motion.div
                        key={`meta-${current}`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                    >
                        <span className="category-badge">
                            Featured Article
                        </span>
                    </motion.div>

                    <motion.h1
                        key={`title-${current}`}
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight tracking-tight"
                    >
                        {currentItem.title}
                    </motion.h1>

                    <motion.p
                        key={`excerpt-${current}`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl font-light leading-relaxed border-l-2 border-sky-blue pl-6"
                    >
                        {currentItem.excerpt}
                    </motion.p>

                    <motion.div
                        key={`btn-${current}`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Link
                            href={`/articles/${currentItem.slug}`}
                            className="btn-gradient inline-block shadow-2xl"
                        >
                            Discover the Truth
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Navigation Dots */}
            {featuredArticles.length > 1 && (
                <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3">
                    {(featuredArticles as Doc<"articles">[]).map((_: Doc<"articles">, idx: number) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                current === idx ? "bg-white w-8" : "bg-white/40"
                            )}
                            style={current === idx ? { background: 'var(--primary-gradient)' } : {}}
                        />
                    ))}
                </div>
            )}

            {/* Side Arrows */}
            {featuredArticles.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm hidden md:block"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm hidden md:block"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}
        </div>
    );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
    return inputs.filter(Boolean).join(" ");
}

