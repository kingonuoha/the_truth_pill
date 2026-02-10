"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface HeroItem {
    id: string;
    title: string;
    excerpt: string;
    image: string;
    category: string;
    slug: string;
}

const MOCK_ITEMS: HeroItem[] = [
    {
        id: "1",
        title: "The Unseen Power: How Observation Can Save and Guide You",
        excerpt: "Discover the psychological weight of truly seeing the world around you and how it shapes your intuition.",
        image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000",
        category: "Life Lessons",
        slug: "the-unseen-power",
    },
    {
        id: "2",
        title: "Stop Rushing Your Journey: The Path of a Lifetime",
        excerpt: "In a world obsessed with speed, we explore the mental health benefits of slowing down and embracing the path.",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=2000",
        category: "Personal Growth",
        slug: "stop-rushing",
    },
    {
        id: "3",
        title: "The Power of Vulnerability in Modern Relationships",
        excerpt: "Why opening up is the strongest thing you can do for your emotional intelligence.",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=2000",
        category: "Relationships",
        slug: "power-of-vulnerability",
    }
];

export function HeroCarousel() {
    const [current, setCurrent] = useState(0);

    const next = () => setCurrent((prev) => (prev + 1) % MOCK_ITEMS.length);
    const prev = () => setCurrent((prev) => (prev - 1 + MOCK_ITEMS.length) % MOCK_ITEMS.length);

    useEffect(() => {
        const timer = setInterval(next, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative h-[95vh] w-full overflow-hidden bg-zinc-900">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] scale-105"
                        style={{ backgroundImage: `url(${MOCK_ITEMS[current].image})` }}
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
                            {MOCK_ITEMS[current].category}
                        </span>
                    </motion.div>

                    <motion.h1
                        key={`title-${current}`}
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight tracking-tight"
                    >
                        {MOCK_ITEMS[current].title}
                    </motion.h1>

                    <motion.p
                        key={`excerpt-${current}`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl font-light leading-relaxed border-l-2 border-sky-blue pl-6"
                    >
                        {MOCK_ITEMS[current].excerpt}
                    </motion.p>

                    <motion.div
                        key={`btn-${current}`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Link
                            href={`/articles/${MOCK_ITEMS[current].slug}`}
                            className="btn-gradient inline-block shadow-2xl"
                        >
                            Discover the Truth
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3">
                {MOCK_ITEMS.map((_, idx) => (
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

            {/* Side Arrows */}
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
        </div>
    );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
    return inputs.filter(Boolean).join(" ");
}
