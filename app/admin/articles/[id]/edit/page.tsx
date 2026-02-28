"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import ArticleForm from "@/components/admin/article-form";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function EditArticlePage() {
    const params = useParams();
    const articleId = params.id as Id<"articles">;
    const article = useQuery(api.articles.getById, { id: articleId });

    if (!article) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Getting your post ready...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link
                    href="/admin/articles"
                    className="flex items-center gap-2 text-zinc-400 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                    <ChevronLeft size={16} />
                    Go back to your posts
                </Link>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-zinc-900">Change your post</h1>
                    <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-widest">Currently editing: {article.title}</p>
                </div>
            </div>

            <ArticleForm initialData={article} isEditing />
        </div>
    );
}
