"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronDown } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";
import { BlogSkeleton } from "./skeletons";

interface BlogGridProps {
    categoryId?: Id<"categories">;
}

export interface JoinedArticle extends Doc<"articles"> {
    categoryName: string;
    authorName: string;
    authorImage?: string;
}

export function BlogGrid({ categoryId, initialArticles }: BlogGridProps & { initialArticles?: JoinedArticle[] }) {
    const [limit, setLimit] = useState(initialArticles?.length || 6);
    const articles = useQuery(api.articles.list, { limit, categoryId }) || initialArticles;

    if (articles === undefined) {
        return <BlogSkeleton />;
    }

    const hasMore = articles.length >= limit;

    const handleLoadMore = () => {
        setLimit(prev => prev + 6);
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                {articles.map((article: JoinedArticle) => (
                    <article key={article._id} className="group flex flex-col items-start">
                        <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-700 mb-6 border border-gray-100 dark:border-gray-800">
                            <Image
                                src={article.coverImage || ""}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute top-4 right-4">
                                <span className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-gray-900 dark:text-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-gray-100 dark:border-gray-800">
                                    {article.categoryName}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 px-2 flex-grow">
                            <Link href={`/articles/${article.slug}`}>
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
                                        src={article.authorImage || getAvatarUrl(article.authorName)}
                                        alt={article.authorName}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 group-hover/author:text-blue-600 transition-colors">{article.authorName}</span>
                            </Link>
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-20 flex justify-center">
                {hasMore ? (
                    <button
                        onClick={handleLoadMore}
                        className="flex items-center gap-2 px-10 py-4 rounded-full bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all duration-300 group shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        Load More Articles
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

function getAvatarUrl(name: string) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`;
}
