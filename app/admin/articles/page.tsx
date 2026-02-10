"use client";

import { Plus, Search, Filter, Eye, Edit2, Trash2 } from "lucide-react";
import { ArticleStatusBadge, ArticleSourceBadge } from "@/components/admin/article-badges";
import Link from "next/link";
import Image from "next/image";

interface AdminArticle {
    id: string;
    title: string;
    category: string;
    status: "draft" | "published" | "scheduled";
    source: "ai" | "human";
    author: string;
    publishedAt: string;
    views: number;
}

const MOCK_ADMIN_ARTICLES: AdminArticle[] = [
    {
        id: "1",
        title: "The Unseen Power: How Observation Can Save and Guide You",
        category: "Life Skills",
        status: "published",
        source: "human",
        author: "Sandra Opara",
        publishedAt: "2025-09-01",
        views: 1240,
    },
    {
        id: "2",
        title: "Understanding the Shadow Self: A Jungian Exploration",
        category: "Human Behavior",
        status: "draft",
        source: "ai",
        author: "System (AI)",
        publishedAt: "-",
        views: 0,
    },
    {
        id: "3",
        title: "Building Resilience in the Digital Age",
        category: "Mental Health",
        status: "scheduled",
        source: "human",
        author: "Sandra Opara",
        publishedAt: "2025-10-15",
        views: 0,
    }
];

export default function AdminArticlesPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-zinc-900">Articles</h1>
                    <p className="text-zinc-500 mt-1">Manage your editorial content and AI drafts.</p>
                </div>
                <Link
                    href="/admin/articles/new"
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                    New Article
                </Link>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Posts", value: "42", color: "text-zinc-900" },
                    { label: "AI Drafts", value: "12", color: "text-purple-600" },
                    { label: "Scheduled", value: "3", color: "text-blue-600" },
                    { label: "Total Reads", value: "18.4k", color: "text-green-600" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors w-full md:w-auto justify-center">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Article</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Origin</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-center">Stats</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {MOCK_ADMIN_ARTICLES.map((article) => (
                            <tr key={article.id} className="hover:bg-zinc-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-zinc-200 overflow-hidden relative flex-shrink-0">
                                            <Image
                                                src={`https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&h=100&fit=crop`}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-serif font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
                                                {article.title}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{article.category} • by {article.author}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <ArticleStatusBadge status={article.status} />
                                </td>
                                <td className="px-6 py-4">
                                    <ArticleSourceBadge source={article.source} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold text-zinc-700">{article.views}</span>
                                        <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Reads</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors" title="View">
                                            <Eye size={16} />
                                        </button>
                                        <button className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors" title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
    return inputs.filter(Boolean).join(" ");
}
