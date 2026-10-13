"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ArticleForm from "@/components/admin/article-form";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { bffFetch } from "@/lib/bff-client";
import type { ArticleRecord } from "@/lib/content-types";

export default function EditArticlePage() {
    const params = useParams();
    const articleId = typeof params.articleId === "string" ? params.articleId : "";
    const [article, setArticle] = useState<ArticleRecord | null>(null);

    useEffect(() => {
        if (!articleId) return;
        const controller = new AbortController();
        (async () => {
            try {
                const data = await bffFetch<ArticleRecord>(
                    `/api/admin/articles/by-id?id=${encodeURIComponent(articleId)}`,
                    { signal: controller.signal },
                );
                if (!controller.signal.aborted) setArticle(data);
            } catch (error) {
                if (!controller.signal.aborted) console.error(error);
            }
        })();
        return () => controller.abort();
    }, [articleId]);

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
