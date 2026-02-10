"use client";

import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Calendar, User, Share2, Bookmark, Heart, Send } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";

import { use } from "react";

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug: _slug } = use(params);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Mock data for initial UI build
    const article = {
        title: "The Unseen Power: How Observation Can Save and Guide You",
        excerpt: "Discover the psychological weight of truly seeing the world around you and how it shapes your intuition.",
        content: `
      <p>Have you ever walked down a familiar street and suddenly noticed a building you've never seen before? Not a new building, but one that has been there for decades. This is the difference between seeing and observing. Seeing is a passive act, a mere biological function. Observation, however, is an active psychological engagement with reality.</p>
      
      <h3>The Psychology of the 'Thin Slice'</h3>
      <p>In psychology, 'thin-slicing' is a term used to describe the ability of our unconscious to find patterns in situations and behavior based on very narrow windows of experience. When we sharpen our observation skills, we provide our brain with better data. This isn't about being paranoid; it's about being present.</p>
      
      <p>Imagine a street in Owerri where a retired nurse, Mrs. Ijeoma, noticed a subtle change in the gait of a local merchant. While others simply saw a man walking to work, her clinical observation identified a potential health risk before it became a crisis. This is the 'Truth Pill'—the realization that the world is constantly speaking to us if we only choose to listen.</p>

      <blockquote>"The world is full of obvious things which nobody by any chance ever observes." — Sherlock Holmes</blockquote>

      <h3>How to Practice Deep Observation</h3>
      <p>To become a better observer, you must first quiet the internal noise. We often walk through life rehearsing future conversations or replaying past mistakes. To truly observe, you must be here, now. Try these three steps:</p>
      <ul>
        <li><strong>The 60-Second Scan:</strong> When you enter a room, spend one full minute just looking. Don't judge, just catalog.</li>
        <li><strong>Vocalizing the Mundane:</strong> Mentally describe what you see in detail. "The wall is eggshell white with a slight crack near the ceiling."</li>
        <li><strong>Pattern Recognition:</strong> Look for what is out of place. Why is that person smiling when the situation is somber?</li>
      </ul>
    `,
        coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1200",
        category: "Life Skills",
        author: "Sandra Opara",
        date: "September 1, 2025",
    };

    return (
        <main className="min-h-screen bg-white pb-20">
            <Navbar />

            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-primary z-[60] origin-left"
                style={{ scaleX }}
            />

            {/* Article Header */}
            <header className="relative w-full min-h-[70vh] bg-zinc-900 overflow-hidden flex flex-col justify-end">
                <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />

                <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-12 w-full">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mb-4"
                    >
                        <span className="category-badge">{article.category}</span>
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-zinc-900 leading-tight tracking-tight"
                    >
                        {article.title}
                    </motion.h1>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center gap-6 mt-8"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                <User size={20} className="text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-tighter text-zinc-900">{article.author}</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Editorial Lead</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 bg-zinc-100/50 px-3 py-1.5 rounded-full backdrop-blur-sm border border-zinc-200/50">
                            <Calendar size={14} className="text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{article.date}</span>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Article Content */}
            <article className="max-w-3xl mx-auto px-6 pt-20">
                <div
                    className="prose prose-zinc prose-lg max-w-none font-sans leading-relaxed text-zinc-800
          prose-headings:font-serif prose-headings:font-bold prose-headings:text-zinc-900
          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-zinc-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:rounded-r-lg
          prose-strong:text-zinc-900 prose-strong:font-black
          prose-img:rounded-2xl prose-img:shadow-xl"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Signature Footer */}
                <footer className="mt-24 pt-12 border-t border-zinc-100">
                    <div className="bg-zinc-50 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex flex-col gap-2 text-center md:text-left">
                            <h3 className="text-2xl font-serif font-bold">Reflected on this truth?</h3>
                            <p className="text-zinc-500 text-sm max-w-xs">If this article shifted your perspective, join our community of intentional readers.</p>
                        </div>

                        <div className="flex items-center gap-1">
                            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-all active:scale-95">
                                <Heart size={18} className="text-red-500" />
                                <span>1.2k</span>
                            </button>
                            <button className="p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all active:scale-95">
                                <Bookmark size={20} className="text-primary" />
                            </button>
                            <button className="p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all active:scale-95">
                                <Share2 size={20} className="text-zinc-600" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 bg-primary p-12 rounded-2xl text-white text-center flex flex-col items-center gap-6 shadow-2xl shadow-primary/30">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold">Never Miss a Pill</h2>
                        <p className="text-blue-100 max-w-sm font-light">Join 15,000+ others who receive weekly insights into human behavior and mental clarity.</p>
                        <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                            <button className="bg-white text-primary px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-zinc-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                                Subscribe <Send size={16} />
                            </button>
                        </div>
                    </div>
                </footer>
            </article>
        </main>
    );
}
