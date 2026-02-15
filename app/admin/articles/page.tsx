"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Archive, Edit2, Eye, FileText,
    Plus, RotateCcw, Search, Trash2, X
} from "lucide-react";
import { ArticleStatusBadge, ArticleSourceBadge } from "@/components/admin/article-badges";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminArticlesPage() {
    const stats = useQuery(api.admin.getDashboardStats, {});

    // Filter States
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [showArchived, setShowArchived] = useState(false);

    // Data Fetching
    const articles = useQuery(api.articles.listAdmin, {
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        source: sourceFilter === "all" ? undefined : sourceFilter,
        isArchived: showArchived
    });

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<Id<"articles">>>(new Set());

    // Mutations
    const archiveArticle = useMutation(api.articles.remove);
    const restoreArticle = useMutation(api.articles.restore);
    const deleteForever = useMutation(api.articles.deleteForever);
    const bulkArchive = useMutation(api.articles.bulkArchive);
    const bulkRestore = useMutation(api.articles.bulkRestore);
    const bulkDeleteForever = useMutation(api.articles.bulkDeleteForever);

    const toggleSelectAll = () => {
        if (!articles) return;
        if (selectedIds.size === articles.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(articles.map(a => a._id)));
        }
    };

    const toggleSelectOne = (id: Id<"articles">) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkArchive = async () => {
        toast("Archive selected articles?", {
            action: {
                label: "Confirm",
                onClick: async () => {
                    try {
                        await bulkArchive({ ids: Array.from(selectedIds) });
                        setSelectedIds(new Set());
                        toast.success("Bulk archive complete");
                    } catch (err) {
                        console.error("Bulk Archive Error:", err);
                        toast.error("Bulk archive failed. Check console for details.");
                    }
                }
            }
        });
    };

    const handleBulkRestore = async () => {
        toast("Restore selected articles?", {
            action: {
                label: "Confirm",
                onClick: async () => {
                    try {
                        await bulkRestore({ ids: Array.from(selectedIds) });
                        setSelectedIds(new Set());
                        toast.success("Bulk restore complete");
                    } catch (err) {
                        console.error("Bulk Restore Error:", err);
                        toast.error("Bulk restore failed");
                    }
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        toast("Permanently delete selected articles? This is irreversible.", {
            action: {
                label: "Delete All",
                onClick: async () => {
                    try {
                        await bulkDeleteForever({ ids: Array.from(selectedIds) });
                        setSelectedIds(new Set());
                        toast.success("Bulk deletion complete");
                    } catch (err) {
                        console.error("Bulk Delete Error:", err);
                        toast.error("Bulk deletion failed. Check console for details.");
                    }
                }
            }
        });
    };

    const handleArchive = (id: Id<"articles">) => {
        toast("Archive this article?", {
            action: {
                label: "Confirm Archive",
                onClick: async () => {
                    try {
                        await archiveArticle({ id });
                        toast.success("Article archived");
                    } catch (err) {
                        console.error("Archive Error:", err);
                        toast.error("Failed to archive. Check console for details.");
                    }
                }
            }
        });
    };

    const handleRestore = async (id: Id<"articles">) => {
        toast("Restore this article?", {
            action: {
                label: "Confirm Restore",
                onClick: async () => {
                    try {
                        await restoreArticle({ id });
                        toast.success("Article restored");
                    } catch (err) {
                        console.error("Restore Error:", err);
                        toast.error("Failed to restore article. Check console for details.");
                    }
                }
            }
        });
    };

    const handleDeleteForever = (id: Id<"articles">) => {
        toast("Permanently delete? This cannot be undone.", {
            action: {
                label: "Delete Forever",
                onClick: async () => {
                    try {
                        await deleteForever({ id });
                        toast.success("Article deleted permanently");
                    } catch (err) {
                        console.error("Delete Error:", err);
                        toast.error("Failed to delete. Check console for details.");
                    }
                }
            },
        });
    };

    const isLoading = !articles || !stats;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-zinc-500 font-medium">Fetching articles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-zinc-900">Articles</h1>
                    <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-widest">Manage your editorial content and AI drafts.</p>
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
                    { label: "Total Posts", value: stats.articles.total.toString(), color: "text-zinc-900" },
                    { label: "AI Drafts", value: stats.articles.aiDrafts.toString(), color: "text-purple-600" },
                    { label: "Scheduled", value: stats.articles.scheduled.toString(), color: "text-blue-600" },
                    { label: "Total Reads", value: (stats.totalViews / 1000).toFixed(1) + "k", color: "text-green-600" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
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
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search articles..."
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* View Toggle */}
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider transition-colors",
                            showArchived
                                ? "bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200"
                                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        )}
                    >
                        {showArchived ? <RotateCcw size={16} /> : <Archive size={16} />}
                        {showArchived ? "View Active" : "View Archived"}
                    </button>

                    <div className="h-8 w-px bg-zinc-200 hidden md:block" />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                    </select>

                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="all">All Sources</option>
                        <option value="human">Human</option>
                        <option value="ai">AI Generated</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="px-6 py-4 w-12 text-center">
                                <input
                                    type="checkbox"
                                    checked={articles?.length > 0 && selectedIds.size === articles?.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-zinc-300 text-primary focus:ring-primary h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Article</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-center">Status</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-center">Origin</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-center">Stats</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {articles.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-zinc-400">
                                    <FileText className="mx-auto mb-2 opacity-20" size={48} />
                                    <p>No articles found matching your filters.</p>
                                </td>
                            </tr>
                        )}
                        {articles.map((article) => (
                            <tr key={article._id} className={cn(
                                "hover:bg-zinc-50 transition-colors group",
                                selectedIds.has(article._id) && "bg-blue-50/50"
                            )}>
                                <td className="px-6 py-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(article._id)}
                                        onChange={() => toggleSelectOne(article._id)}
                                        className="rounded border-zinc-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden relative flex-shrink-0 border border-zinc-100">
                                            <Image
                                                src={article.coverImage || `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&h=100&fit=crop`}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-serif font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
                                                    {article.title}
                                                </p>
                                                {article.isArchived && (
                                                    <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 uppercase">Archived</span>
                                                )}
                                            </div>

                                            <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-400 mt-0.5">
                                                {article.categoryName} • by {article.authorName}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <ArticleStatusBadge status={article.status} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <ArticleSourceBadge source={article.source} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-black text-zinc-700">{article.viewCount || 0}</span>
                                        <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Reads</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!article.isArchived && (
                                            <>
                                                <Link
                                                    href={`/articles/${article.slug}`}
                                                    target="_blank"
                                                    className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"
                                                    title="View Publicly"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <Link
                                                    href={`/admin/articles/${article._id}/edit`}
                                                    className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"
                                                    title="Edit Content"
                                                >
                                                    <Edit2 size={16} />
                                                </Link>
                                            </>
                                        )}

                                        {article.isArchived ? (
                                            <>
                                                <button
                                                    onClick={() => handleRestore(article._id)}
                                                    className="p-2 hover:bg-green-50 rounded-lg text-green-400 hover:text-green-600 transition-colors"
                                                    title="Restore"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteForever(article._id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-red-300 hover:text-red-600 transition-colors"
                                                    title="Delete Forever"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleArchive(article._id)}
                                                className="p-2 hover:bg-amber-50 rounded-lg text-zinc-300 hover:text-amber-600 transition-colors"
                                                title="Archive"
                                            >
                                                <Archive size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-300 z-50">
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Selected</span>
                        <span className="text-lg font-black">{selectedIds.size} Articles</span>
                    </div>

                    <div className="h-8 w-px bg-zinc-800" />

                    <div className="flex items-center gap-3">
                        {showArchived ? (
                            <button
                                onClick={handleBulkRestore}
                                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <RotateCcw size={14} /> Restore
                            </button>
                        ) : (
                            <button
                                onClick={handleBulkArchive}
                                className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <Archive size={14} /> Archive
                            </button>
                        )}
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>

                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-zinc-500 hover:text-white transition-colors p-2"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
