"use client";

import ArticleForm from "@/components/admin/article-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewArticlePage() {
    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link
                    href="/admin/articles"
                    className="flex items-center gap-2 text-zinc-400 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                    <ChevronLeft size={16} />
                    Back to Articles
                </Link>
                <div>
                    <h1 className="text-3xl font-serif font-bold dark:text-zinc-900">Create New Article</h1>
                    <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-widest">Craft your next viral piece of truth.</p>
                </div>
            </div>

            <ArticleForm />
        </div>
    );
}
