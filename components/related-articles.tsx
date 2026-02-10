"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowRight } from "lucide-react";

interface RelatedArticlesProps {
    categoryId: Id<"categories">;
    excludeId: Id<"articles">;
    lean?: boolean;
}

export function RelatedArticles({ categoryId, excludeId, lean = false }: RelatedArticlesProps) {
    // We need to get the category slug first to use getByCategory
    const category = useQuery(api.categories.getById, { id: categoryId });
    const relatedArticles = useQuery(
        api.articles.getByCategory,
        category?.slug ? { categorySlug: category.slug, limit: 10 } : "skip"
    );

    if (relatedArticles === undefined) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-sky-blue opacity-50" />
            </div>
        );
    }

    const filteredArticles = relatedArticles
        .filter(a => a._id !== excludeId)
        .slice(0, lean ? 5 : 3);

    if (filteredArticles.length === 0) {
        return <p className="text-zinc-400 text-sm italic">More truths coming soon.</p>;
    }

    if (lean) {
        return (
            <div className="flex flex-col gap-6">
                {filteredArticles.map((article) => (
                    <Link
                        key={article._id}
                        href={`/articles/${article.slug}`}
                        className="group flex gap-4 items-start"
                    >
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                            <Image
                                src={article.coverImage}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-serif font-bold text-zinc-900 group-hover:text-sky-blue transition-colors leading-tight mb-1 line-clamp-2">
                                {article.title}
                            </h4>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                {new Date(article.publishedAt || article._creationTime).toLocaleDateString(undefined, {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
                <Link
                    key={article._id}
                    href={`/articles/${article.slug}`}
                    className="group"
                >
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all">
                        <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-zinc-900 group-hover:text-sky-blue transition-colors leading-tight mb-2">
                        {article.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sky-blue text-[10px] font-black uppercase tracking-widest">
                        Read Now <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
