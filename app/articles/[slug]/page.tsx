"use client";

import { use } from "react";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Calendar, User, Clock, ChevronRight } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { EngagementToolbar } from "@/components/engagement-toolbar";
import { TableOfContents } from "@/components/table-of-contents";
import { CommentsSection } from "@/components/comments-section";
import { RelatedArticles } from "@/components/related-articles";
import { Newsletter } from "@/components/newsletter";

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const article = useQuery(api.articles.getBySlug, { slug });

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    if (article === undefined) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-8 h-8 border-4 border-sky-blue border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (article === null) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-serif font-bold mb-4">Article Not Found</h1>
                <p className="text-zinc-500 mb-8">The truth you&apos;re looking for might have moved.</p>
                <Link href="/" className="btn-gradient">Return Home</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white pb-20">
            <Navbar />

            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-blue to-school-purple z-[60] origin-left"
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
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

                <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-12 w-full">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-6">
                        <Link href="/" className="hover:text-sky-blue transition-colors">Home</Link>
                        <ChevronRight size={12} />
                        <Link href={`/categories/${article.categorySlug}`} className="hover:text-sky-blue transition-colors">{article.categoryName}</Link>
                    </nav>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mb-4"
                    >
                        <span className="category-badge">{article.categoryName}</span>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl lg:text-7xl font-serif font-bold text-zinc-900 leading-tight tracking-tight max-w-4xl"
                    >
                        {article.title}
                    </motion.h1>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center gap-6 mt-10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xl">
                                {article.authorImage ? (
                                    <Image src={article.authorImage} alt={article.authorName} width={48} height={48} className="object-cover" />
                                ) : (
                                    <div className="bg-primary/20 w-full h-full flex items-center justify-center">
                                        <User size={20} className="text-primary" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-tighter text-zinc-900">{article.authorName}</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Verified Author</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-zinc-500 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                                <Calendar size={14} className="text-sky-blue" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-500 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                                <Clock size={14} className="text-school-purple" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{article.readingTime} Min Read</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Main Content Layout */}
            <div className="relative max-w-7xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-16 pt-20">
                    {/* Left Sidebar - Engagement */}
                    <aside className="hidden lg:block w-20 relative">
                        <div className="sticky top-32">
                            <EngagementToolbar articleId={article._id} />
                        </div>
                    </aside>

                    {/* Content Column */}
                    <div className="flex-1 max-w-3xl">
                        <article
                            className="prose prose-zinc prose-lg max-w-none font-serif leading-[1.8] text-zinc-800 text-[18px]
                            prose-headings:font-serif prose-headings:font-bold prose-headings:text-zinc-900
                            prose-blockquote:border-l-4 prose-blockquote:border-sky-blue prose-blockquote:bg-zinc-50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:italic prose-blockquote:rounded-r-xl prose-blockquote:text-zinc-700
                            prose-strong:text-zinc-900 prose-strong:font-black
                            prose-img:rounded-3xl prose-img:shadow-2xl"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        {/* Author Bio Card */}
                        <div className="mt-24 bg-zinc-50 rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8 border border-zinc-100">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl flex-shrink-0">
                                {article.authorImage ? (
                                    <Image src={article.authorImage} alt={article.authorName} width={96} height={96} className="object-cover" />
                                ) : (
                                    <div className="bg-primary/20 w-full h-full flex items-center justify-center">
                                        <User size={40} className="text-primary" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-serif font-bold mb-2">{article.authorName}</h3>
                                <p className="text-zinc-500 font-light text-sm leading-relaxed mb-4">
                                    Deep diver into human behavior and mental models. Passionate about uncovering the hidden truths that shape our lives.
                                </p>
                                <Link
                                    href={`/author/${article.authorId}`}
                                    className="text-sky-blue font-bold text-xs uppercase tracking-widest hover:underline"
                                >
                                    View all articles by {article.authorName}
                                </Link>
                            </div>
                        </div>

                        {/* Newsletter Subscription */}
                        <div className="mt-24">
                            <Newsletter />
                        </div>

                        {/* Comments Section */}
                        <div className="mt-24">
                            <CommentsSection articleId={article._id} />
                        </div>
                    </div>

                    {/* Right Sidebar - TOC & Recommended */}
                    <aside className="hidden xl:block w-80 relative">
                        <div className="sticky top-32 flex flex-col gap-12 max-h-[calc(100vh-160px)] overflow-y-auto pb-10 pr-4">
                            <TableOfContents />

                            <div className="pt-8 border-t border-zinc-100">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-zinc-100" />
                                    Recommended Posts
                                </h3>
                                <RelatedArticles categoryId={article.categoryId} excludeId={article._id} lean />
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Mobile Recommended Sections */}
            <div className="xl:hidden bg-zinc-50 border-t border-zinc-100 mt-20 py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-serif font-bold mb-8">Related Insights</h2>
                    <RelatedArticles categoryId={article.categoryId} excludeId={article._id} />
                </div>
            </div>
        </main>
    );
}
