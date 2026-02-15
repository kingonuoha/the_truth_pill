"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ChevronDown, CheckCircle2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";
import { BlogSkeleton } from "./skeletons";

interface BlogGridProps {
    categoryId?: Id<"categories">;
}

interface JoinedArticle extends Doc<"articles"> {
    categoryName: string;
    authorName: string;
    authorImage?: string;
}

export function BlogGrid({ categoryId }: BlogGridProps) {
    const [limit, setLimit] = useState(6);
    const articles = useQuery(api.articles.list, { limit, categoryId });

    if (articles === undefined) {
        return <BlogSkeleton />;
    }

    const hasMore = articles.length >= limit;

    const handleLoadMore = () => {
        setLimit(prev => prev + 6);
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {articles.map((article: JoinedArticle) => (
                    <article key={article._id} className="group flex flex-col items-start gap-5">
                        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                            <Image
                                src={article.coverImage || ""}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute top-4 right-4">
                                <span className="category-badge bg-white/90 backdrop-blur-md text-zinc-900 border-none shadow-sm pb-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {article.categoryName}
                                </span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        <div className="flex flex-col gap-3 px-1">
                            <Link href={`/articles/${article.slug}`}>
                                <h2 className="text-xl md:text-2xl font-serif font-bold leading-tight group-hover:text-primary transition-colors">
                                    {article.title}
                                </h2>
                            </Link>
                            <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed font-medium">
                                {article.excerpt}
                            </p>
                        </div>

                        <div className="flex items-center gap-6 mt-2 py-3 px-4 bg-zinc-50 rounded-2xl w-full border border-zinc-100 group-hover:bg-white group-hover:border-primary/20 transition-all duration-500">
                            <Link href={`/author/${article.authorId}`} className="flex items-center gap-2 group/author">
                                <div className="w-7 h-7 rounded-full overflow-hidden border border-zinc-200">
                                    {article.authorImage ? (
                                        <Image src={article.authorImage} alt={article.authorName} width={28} height={28} className="object-cover" />
                                    ) : (
                                        <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                                            <User size={14} className="text-primary" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-black uppercase tracking-tighter text-zinc-900 group-hover/author:text-primary transition-colors">{article.authorName}</span>
                            </Link>
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar size={14} />
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

            <div className="mt-20 flex justify-center pb-20">
                {hasMore ? (
                    <button
                        onClick={handleLoadMore}
                        className="flex items-center gap-2 px-10 py-4 rounded-full bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-sky-blue transition-all duration-300 group shadow-xl hover:shadow-sky-blue/20"
                    >
                        Load More Articles
                        <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-10">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="text-center">
                            <p className="text-zinc-900 font-serif font-bold text-xl">You have reached the end</p>
                            <p className="text-zinc-400 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">Much more to come soon</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
