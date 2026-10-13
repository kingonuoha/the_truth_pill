"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronDown, Eye, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BlogSkeleton } from "./skeletons";
import { getCloudinaryUrl, getAvatarUrl } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { bffFetch } from "@/lib/bff-client";
import type { ArticleListItem, PaginatedArticles } from "@/lib/content-types";

export type JoinedArticle = ArticleListItem;

interface BlogGridProps {
    categoryId?: string;
    pillar?: string;
    type?: string;
}

interface BlogGridInjectedProps {
    initialArticles?: ArticleListItem[];
    initialPage?: number;
    initialHasMore?: boolean;
}

const PAGE_SIZE = 6;

async function fetchPage(
    page: number,
    filters: { categoryId?: string; pillar?: string; type?: string },
): Promise<PaginatedArticles> {
    const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
    });
    if (filters.categoryId) qs.set("categoryId", filters.categoryId);
    if (filters.pillar) qs.set("pillar", filters.pillar);
    if (filters.type) qs.set("type", filters.type);
    return bffFetch<PaginatedArticles>(`/api/articles?${qs.toString()}`);
}

export function BlogGrid({ categoryId, pillar, type, initialArticles, initialPage, initialHasMore }: BlogGridProps & BlogGridInjectedProps) {
    const [articles, setArticles] = useState<ArticleListItem[]>(initialArticles || []);
    const [page, setPage] = useState<number>(initialPage ?? 1);
    const [hasMore, setHasMore] = useState<boolean>(initialHasMore ?? true);
    const [isInitialLoading, setIsInitialLoading] = useState(!initialArticles);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const fetchedInitialRef = useRef(Boolean(initialArticles));

    // Fetch the first page ONCE on mount when the page did not SSR initial data
    // (e.g. filtered category/pillar grids).
    useEffect(() => {
        if (fetchedInitialRef.current) return;
        fetchedInitialRef.current = true;
        let cancelled = false;
        (async () => {
            try {
                const result = await fetchPage(1, { categoryId, pillar, type });
                if (cancelled) return;
                setArticles(result.items);
                setPage(result.page);
                setHasMore(result.page < result.totalPages);
            } catch (error) {
                console.error("Failed to load articles:", error);
            } finally {
                if (!cancelled) setIsInitialLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [categoryId, pillar, type]);

    const handleLoadMore = async () => {
        if (isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const result = await fetchPage(page + 1, { categoryId, pillar, type });
            setArticles((prev) => {
                const seen = new Set(prev.map((a) => a.id));
                return [...prev, ...result.items.filter((a) => !seen.has(a.id))];
            });
            setPage(result.page);
            setHasMore(result.page < result.totalPages);
        } catch (error) {
            console.error("Failed to load more articles:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    if (isInitialLoading) {
        return <BlogSkeleton />;
    }

    if (!articles || articles.length === 0) {
        return (
            <EmptyState 
                title="No Insights Found" 
                description="We couldn't find any articles matching your current filter. Try exploring a different pillar or topic."
                illustration="No-results-found.svg"
                action={
                    <Link 
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        <Search size={14} />
                        Explore All Truths
                    </Link>
                }
            />
        );
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                {articles.map((article) => (
                    <article key={article.id} className="group flex flex-col items-start">
                        <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-700 mb-6 border border-gray-100 dark:border-gray-800">
                            <Image
                                src={getCloudinaryUrl(article.coverImage || "", "w_800,c_fill,q_auto,f_auto")}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                unoptimized
                            />
                            <div className="absolute top-4 right-4">
                                <span className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-gray-900 dark:text-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-gray-100 dark:border-gray-800">
                                    {article.categoryName}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 px-2 flex-grow">
                            <Link href={`/${article.slug}`}>
                                <h2 className="text-xl md:text-2xl font-serif font-black leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {article.title}
                                </h2>
                            </Link>
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed font-medium">
                                {article.excerpt}
                            </p>
                        </div>

                        <div className="flex items-center justify-between w-full mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 px-2">
                            <Link href={`/author/${article.authorId}`} className="flex items-center gap-2 group/author">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                                    <Image
                                        src={getAvatarUrl(article.authorName || "Author", article.authorImage ?? undefined)}
                                        alt={article.authorName || "Author"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 group-hover/author:text-blue-600 transition-colors">{article.authorName || "Author"}</span>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <Eye size={12} className="text-blue-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{article.viewCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <Calendar size={12} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {new Date(article.publishedAt || article.createdAt || 0).toLocaleDateString('en-US', {
                                            month: 'short',day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-20 flex justify-center">
                {hasMore ? (
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="flex items-center gap-2 px-10 py-4 rounded-full bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all duration-300 group shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoadingMore ? "Loading..." : "Load More Articles"}
                        <ChevronDown size={14} className="group-hover:translate-y-1 transition-transform" />
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-10 opacity-60">
                        <div className="text-center">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">End of Archive</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
