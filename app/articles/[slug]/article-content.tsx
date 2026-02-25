"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Calendar, User, Clock, ChevronRight, ChevronUp } from "lucide-react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { EngagementToolbar } from "@/components/engagement-toolbar";
import { TableOfContents } from "@/components/table-of-contents";
import { RelatedArticles } from "@/components/related-articles";
import { Newsletter } from "@/components/newsletter";
import { AdSlot } from "@/components/ad-slot";
import { getAvatarUrl, getVisitorId } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";
import dynamic from "next/dynamic";

const CommentsSection = dynamic(() => import("@/components/comments-section").then(mod => mod.CommentsSection), {
    loading: () => <div className="h-40 bg-zinc-50 rounded-3xl animate-pulse" />,
    ssr: false
});

type ArticleWithExtras = Doc<"articles"> & {
    authorName: string;
    authorImage?: string;
    categoryName: string;
    categorySlug?: string;
};

export function ArticleContent({ initialArticle, slug }: { initialArticle: ArticleWithExtras; slug: string }) {
    // We can still use useQuery to get live updates if status changes, but initialArticle provides SSR content
    const article = useQuery(api.articles.getBySlug, { slug }) || initialArticle;

    const logView = useMutation(api.analytics.logArticleView);
    const logHeartbeat = useMutation(api.analytics.logHeartbeat);

    useEffect(() => {
        if (article?._id) {
            const visitorId = getVisitorId();

            // Initial view log
            logView({
                articleId: article._id,
                visitorId
            }).catch(console.error);

            // Heartbeat every 30 seconds
            const interval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    logHeartbeat({
                        articleId: article._id,
                        visitorId,
                        seconds: 30
                    }).catch(console.error);
                }
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [article?._id, logView, logHeartbeat]);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 1000);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [hasRead, setHasRead] = useState(false);

    useEffect(() => {
        return scrollYProgress.on("change", (latest) => {
            if (latest > 0.9 && !hasRead) {
                setHasRead(true);
            }
        });
    }, [scrollYProgress, hasRead]);

    const transformOembedToIframe = (content: string) => {
        if (!content) return "";

        // Regex to find <oembed url="..."></oembed>
        const oembedRegex = /<oembed url="([^"]+)"><\/oembed>/g;

        return content.replace(oembedRegex, (match, url) => {
            // Check if it's a YouTube URL
            const youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^?&\s]+)/);

            if (youtubeMatch && youtubeMatch[1]) {
                const videoId = youtubeMatch[1];
                return `<div class="aspect-video w-full my-16 rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800 bg-black">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen
                        class="w-full h-full"
                    ></iframe>
                </div>`;
            }

            return `<div class="my-12 p-8 bg-zinc-50 dark:bg-card rounded-[2rem] border border-dashed border-zinc-200 dark:border-white/5 text-center">
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-sm font-bold text-sky-blue hover:underline transition-all uppercase tracking-widest">View External Content →</a>
            </div>`;
        });
    };

    const renderContentWithAds = (content: string) => {
        if (!content) return { top: "", bottom: "" };

        // Transform video embeds first
        const transformedContent = transformOembedToIframe(content);

        const paragraphs = transformedContent.split('</p>');
        if (paragraphs.length > 2) {
            // Reconstruct with middle ad after 2nd paragraph
            const top = paragraphs.slice(0, 2).join('</p>') + '</p>';
            const bottom = paragraphs.slice(2).join('</p>');

            return { top, bottom };
        }
        return { top: transformedContent, bottom: "" };
    };

    const splittedContent = renderContentWithAds(article.content || "");

    if (!article) return null;

    return (
        <main className="min-h-screen bg-white dark:bg-background pb-20 transition-colors duration-500">
            <Navbar />

            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-blue to-school-purple z-[60] origin-left"
                style={{ scaleX }}
            />

            {/* Read Completion Badge */}
            <AnimatePresence>
                {hasRead && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[55]"
                    >
                        <div className="bg-white dark:bg-card px-6 py-3 rounded-full border border-zinc-100 dark:border-white/5 shadow-2xl flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-white text-[10px] font-black"
                                >
                                    ✓
                                </motion.div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">Truth Absorbed</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Article Header */}
            <header className="relative w-full min-h-[70vh] bg-zinc-900 overflow-hidden flex flex-col justify-end">
                <Image
                    src={article.coverImage || "https://images.unsplash.com/photo-1507413245164-6160d8298b31"}
                    alt={article.title}
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-white/40 dark:via-zinc-950/40 to-transparent" />

                <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-12 w-full">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-6">
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
                        className="text-3xl md:text-5xl lg:text-7xl font-serif font-bold text-zinc-900 dark:text-white leading-tight tracking-tight max-w-4xl"
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
                                <Image
                                    src={getAvatarUrl(article.authorName, article.authorImage || undefined)}
                                    alt={article.authorName}
                                    width={48}
                                    height={48}
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">{article.authorName}</span>
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest leading-none">Verified Author</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-card/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm">
                                <Calendar size={14} className="text-sky-blue" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-card/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm">
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
                            <EngagementToolbar articleId={article._id} slug={article.slug} vertical={true} />
                        </div>
                    </aside>

                    <div className="flex-1 max-w-3xl">
                        <AdSlot position="showAdTopOfArticle" className="mb-12 flex justify-center" />

                        <article
                            className="article-premium prose prose-zinc prose-lg dark:prose-invert max-w-none prose-headings:font-serif"
                            onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.tagName === 'IMG') {
                                    setSelectedImage((target as HTMLImageElement).src);
                                }
                            }}
                        >
                            <div dangerouslySetInnerHTML={{ __html: splittedContent.top }} />

                            {splittedContent.bottom && (
                                <>
                                    <AdSlot position="showAdMiddleOfArticle" className="my-16 flex justify-center" />
                                    <div dangerouslySetInnerHTML={{ __html: splittedContent.bottom }} />
                                </>
                            )}
                        </article>

                        <AdSlot position="showAdBottomOfArticle" className="mt-16 mb-8 flex justify-center" />

                        {/* Author Bio Card */}
                        <div className="mt-24 bg-zinc-50 dark:bg-card/50 rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8 border border-zinc-100 dark:border-white/5 transition-colors">
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
                                <h3 className="text-2xl font-serif font-bold mb-2 text-zinc-900 dark:text-white">{article.authorName}</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 font-light text-sm leading-relaxed mb-4">
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

                        {/* Mobile/Tablet Engagement Bar */}
                        <div className="lg:hidden mt-16 mb-8">
                            <EngagementToolbar articleId={article._id} slug={article.slug} />
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
                            <AdSlot position="showAdSidebar" className="mb-8" />
                            <TableOfContents />

                            <div className="flex flex-col gap-6">
                                {article.categoryId && (
                                    <RelatedArticles categoryId={article.categoryId} excludeId={article._id} lean />
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Mobile Recommended Sections */}
            <div className="xl:hidden bg-zinc-50 dark:bg-card/30 border-t border-zinc-100 dark:border-white/5 mt-20 py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-serif font-bold mb-8 text-zinc-900 dark:text-white">Related Insights</h2>
                    {article.categoryId && (
                        <RelatedArticles categoryId={article.categoryId} excludeId={article._id} />
                    )}
                </div>
            </div>

            {/* Image Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative max-w-7xl max-h-full"
                        >
                            <Image
                                src={selectedImage}
                                alt="High quality view"
                                width={1920}
                                height={1080}
                                className="object-contain max-h-[90vh] rounded-lg shadow-2xl"
                            />
                        </motion.div>
                        <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                            <Clock size={32} className="rotate-45" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Scroll to Top */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-zinc-900 dark:bg-background-100 text-white dark:text-zinc-900 rounded-2xl shadow-2xl flex items-center justify-center hover:bg-sky-blue dark:hover:bg-sky-blue hover:-translate-y-2 transition-all duration-300 group"
                    >
                        <ChevronUp size={24} className="group-hover:animate-bounce" />
                        <div className="absolute -top-12 right-0 bg-zinc-900 dark:bg-card text-[10px] font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Scroll to Top
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </main>
    );
}
