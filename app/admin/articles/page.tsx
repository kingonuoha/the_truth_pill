"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Archive, Edit2, Eye, FileText,
    Plus, RotateCcw, Search, Trash2, X, Sparkles, Clock, Users,
    LayoutGrid, List
} from "lucide-react";
import { ArticleStatusBadge, ArticleSourceBadge } from "@/components/admin/article-badges";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { cn, getCloudinaryUrl } from "@/lib/utils";

export default function AdminArticlesPage() {
    const stats = useQuery(api.admin.getDashboardStats, {});

    // Filter States
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [showArchived, setShowArchived] = useState(false);
    const [viewType, setViewType] = useState<"card" | "list">("card");

    // Data Fetching
    const articles = useQuery(api.articles.listAdmin, {
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        source: sourceFilter === "all" ? undefined : sourceFilter,
        isArchived: showArchived
    });

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<Id<"articles">>>(new Set());
    const [switchingAuthorFor, setSwitchingAuthorFor] = useState<Id<"articles"> | null>(null);

    // Mutations
    const updateArticle = useMutation(api.articles.update);
    const authors = useQuery(api.articles.listAuthors);
    const archiveArticle = useMutation(api.articles.remove);
    const restoreArticle = useMutation(api.articles.restore);
    const deleteForever = useMutation(api.articles.deleteForever);
    const bulkArchive = useMutation(api.articles.bulkArchive);
    const bulkRestore = useMutation(api.articles.bulkRestore);
    const bulkDeleteForever = useMutation(api.articles.bulkDeleteForever);

    const handleSwitchAuthor = async (authorId: Id<"users">) => {
        if (!switchingAuthorFor) return;
        try {
            await updateArticle({
                id: switchingAuthorFor,
                authorId: authorId,
            });
            toast.success("Author updated successfully");
            setSwitchingAuthorFor(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update author");
        }
    };

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
                        toast.error("Bulk archive failed");
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
        toast("Permanently delete selected articles?", {
            action: {
                label: "Delete All",
                onClick: async () => {
                    try {
                        await bulkDeleteForever({ ids: Array.from(selectedIds) });
                        setSelectedIds(new Set());
                        toast.success("Bulk deletion complete");
                    } catch (err) {
                        console.error("Bulk Delete Error:", err);
                        toast.error("Bulk deletion failed");
                    }
                }
            }
        });
    };

    const handleArchive = (id: Id<"articles">) => {
        toast("Archive this article?", {
            action: {
                label: "Archive",
                onClick: async () => {
                    try {
                        await archiveArticle({ id });
                        toast.success("Article archived");
                    } catch (err) {
                        console.error("Archive Error:", err);
                        toast.error("Failed to archive");
                    }
                }
            }
        });
    };

    const handleRestore = async (id: Id<"articles">) => {
        toast("Restore this article?", {
            action: {
                label: "Restore",
                onClick: async () => {
                    try {
                        await restoreArticle({ id });
                        toast.success("Article restored");
                    } catch (err) {
                        console.error("Restore Error:", err);
                        toast.error("Failed to restore article");
                    }
                }
            }
        });
    };

    const handleDeleteForever = (id: Id<"articles">) => {
        toast("Permanently delete this article?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await deleteForever({ id });
                        toast.success("Article deleted permanently");
                    } catch (err) {
                        console.error("Delete Error:", err);
                        toast.error("Failed to delete");
                    }
                }
            },
        });
    };

    const isLoading = !articles || !stats;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] transition-colors duration-500">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-600 dark:border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium font-sans">Syncing posts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 font-sans w-full max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-gray-950 dark:text-white tracking-tight transition-colors">Library</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium font-sans">Manage your blog posts, drafts, and AI pieces.</p>
                </div>
                <Link
                    href="/admin/articles/new"
                    className="bg-purple-600 dark:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 hover:bg-purple-700 dark:hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-200 dark:hover:shadow-purple-900/20 transition-all active:scale-95 shadow-lg shadow-purple-100 dark:shadow-none"
                >
                    <Plus size={20} />
                    New Article
                </Link>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MiniStatCard
                    label="Total Posts"
                    value={stats.articles.total.toString()}
                    icon={FileText}
                    color="blue"
                    illustration="/illustrations/Notes.svg"
                />
                <MiniStatCard
                    label="AI Drafts"
                    value={stats.articles.aiDrafts.toString()}
                    icon={Sparkles}
                    color="purple"
                    illustration="/illustrations/Idea.svg"
                />
                <MiniStatCard
                    label="Scheduled"
                    value={stats.articles.scheduled.toString()}
                    icon={Clock}
                    color="blue"
                    illustration="/illustrations/Launch.svg"
                />
                <MiniStatCard
                    label="Total Reads"
                    value={stats.totalViews.toLocaleString()}
                    icon={Eye}
                    color="blue"
                    illustration="/illustrations/Visual-data.svg"
                />
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-xl transition-all duration-500">
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <input
                            type="checkbox"
                            checked={articles && articles.length > 0 && selectedIds.size === articles.length}
                            onChange={toggleSelectAll}
                            className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent text-blue-600 focus:ring-blue-500/20 cursor-pointer transition-all"
                            title="Select All"
                        />
                    </div>
                    <div className="relative flex-1 md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search posts..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-950/30 border border-gray-100 dark:border-white/5 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-medium text-sm text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* View Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mr-2">
                        <button
                            onClick={() => setViewType("card")}
                            className={cn(
                                "p-2 rounded-lg transition-all active:scale-90",
                                viewType === "card"
                                    ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewType("list")}
                            className={cn(
                                "p-2 rounded-lg transition-all active:scale-90",
                                viewType === "list"
                                    ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all active:scale-95",
                            showArchived
                                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                    >
                        {showArchived ? <RotateCcw size={16} /> : <Archive size={16} />}
                        {showArchived ? "Active" : "Archived"}
                    </button>

                    <div className="h-8 w-px bg-gray-100 dark:bg-gray-800 hidden md:block mx-1" />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-black uppercase tracking-[0.1em] text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none cursor-pointer pr-10 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjOTQ5NGEyIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
                    >
                        <option value="all">Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                    </select>

                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-black uppercase tracking-[0.1em] text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none cursor-pointer pr-10 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjOTQ5NGEyIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
                    >
                        <option value="all">Source</option>
                        <option value="human">Human</option>
                        <option value="ai">AI Generated</option>
                    </select>
                </div>
            </div>

            {/* Articles Grid/List */}
            {articles.length === 0 ? (
                <div className="py-24 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-500">
                    <FileText className="mx-auto mb-6 text-gray-200 dark:text-gray-800" size={80} />
                    <h3 className="text-xl font-serif font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">No posts found</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 max-w-xs mx-auto">Your library is currently empty. Create a new post to get started.</p>
                </div>
            ) : viewType === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <motion.div
                            key={article._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            className={cn(
                                "group relative bg-white/70 dark:bg-zinc-950/50 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] transition-all duration-700 h-full flex flex-col",
                                selectedIds.has(article._id) && "ring-2 ring-blue-500/50 bg-blue-50/10 dark:bg-blue-500/5"
                            )}
                        >
                            {/* Selection Overlay */}
                            <div className="absolute top-6 left-6 z-20">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(article._id)}
                                    onChange={() => toggleSelectOne(article._id)}
                                    className="w-5 h-5 rounded-lg border-2 border-white/20 bg-black/20 text-blue-600 focus:ring-0 cursor-pointer backdrop-blur-md transition-all scale-100 group-hover:scale-110 active:scale-90"
                                />
                            </div>

                            {/* Status Badge Overlays */}
                            <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
                                <ArticleStatusBadge status={article.status} />
                                <ArticleSourceBadge source={article.source} />
                            </div>

                            {/* Image Container */}
                            <div className="aspect-[16/10] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <Image
                                    src={getCloudinaryUrl(article.coverImage || "", "w_600,c_fill,q_auto,f_auto") || `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop`}
                                    alt={article.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90 bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                                        {article.categoryName}
                                    </span>
                                    {article.isArchived && (
                                        <span className="bg-amber-500/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-wider shadow-lg">Archived</span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 flex flex-col flex-grow">
                                <Link
                                    href={`/admin/articles/${article._id}/edit`}
                                    className="block mb-4"
                                >
                                    <h3 className="text-xl font-serif font-black text-gray-950 dark:text-white leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                                        {article.title}
                                    </h3>
                                </Link>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                                        {article.authorImage ? (
                                            <Image src={article.authorImage} alt={article.authorName} width={32} height={32} className="object-cover" />
                                        ) : (
                                            <Users size={14} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">By</span>
                                        <span className="text-xs font-bold text-gray-950 dark:text-zinc-300">{article.authorName}</span>
                                    </div>
                                </div>

                                {/* Metrics & Actions Footer */}
                                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1">
                                                <Eye size={12} className="text-blue-500" />
                                                <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{article.viewCount || 0}</span>
                                            </div>
                                            <span className="text-[9px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest">Views</span>
                                        </div>
                                        <div className="w-px h-6 bg-gray-100 dark:bg-gray-800" />
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1">
                                                <Users size={12} className="text-purple-500" />
                                                <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{article.uniqueViewCount || 0}</span>
                                            </div>
                                            <span className="text-[9px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest">Visitors</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                        {!article.isArchived ? (
                                            <>
                                                <Link
                                                    href={`/articles/${article.slug}`}
                                                    target="_blank"
                                                    className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-blue-600 transition-all hover:scale-110"
                                                    title="Preview"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => setSwitchingAuthorFor(article._id)}
                                                    className="p-2.5 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl text-zinc-400 hover:text-purple-600 transition-all hover:scale-110 flex items-center gap-1 group/btn"
                                                    title="Switch Author"
                                                >
                                                    <Users size={18} />
                                                    <span className="text-[9px] font-black uppercase tracking-tighter hidden group-hover/btn:block">Switch Author</span>
                                                </button>
                                                <Link
                                                    href={`/admin/articles/${article._id}/edit`}
                                                    className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-blue-600 transition-all hover:scale-110"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleArchive(article._id)}
                                                    className="p-2.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl text-zinc-400 hover:text-amber-600 transition-all hover:scale-110"
                                                    title="Archive"
                                                >
                                                    <Archive size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleRestore(article._id)}
                                                    className="p-2.5 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl text-zinc-400 hover:text-green-600 transition-all hover:scale-110"
                                                    title="Restore"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteForever(article._id)}
                                                    className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-600 transition-all hover:scale-110"
                                                    title="Delete Forever"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden w-full max-w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full border-collapse min-w-[900px] table-auto">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5">
                                    <th className="p-6 text-left w-20">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={articles.length > 0 && selectedIds.size === articles.length}
                                                onChange={toggleSelectAll}
                                                className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent text-blue-600 focus:ring-0 cursor-pointer transition-all"
                                            />
                                        </div>
                                    </th>
                                    <th className="py-6 px-4 text-left max-w-[300px]">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Content</span>
                                    </th>
                                    <th className="py-6 px-4 text-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Status</span>
                                    </th>
                                    <th className="py-6 px-4 text-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Origin</span>
                                    </th>
                                    <th className="py-6 px-4 text-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Audience</span>
                                    </th>
                                    <th className="py-6 px-4 text-right w-32">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic mr-6">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.map((article) => (
                                    <tr
                                        key={article._id}
                                        className={cn(
                                            "border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group/row",
                                            selectedIds.has(article._id) && "bg-blue-50/20 dark:bg-blue-500/5 shadow-[inset_4px_0_0_#2563eb]"
                                        )}
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(article._id)}
                                                    onChange={() => toggleSelectOne(article._id)}
                                                    className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent text-blue-600 focus:ring-0 cursor-pointer transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 max-w-[300px]">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm">
                                                    <Image
                                                        src={getCloudinaryUrl(article.coverImage || "", "w_120,c_fill,q_auto,f_auto") || `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&h=120&fit=crop`}
                                                        alt={article.title}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <Link
                                                        href={`/admin/articles/${article._id}/edit`}
                                                        className="block text-sm font-black text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate mb-1"
                                                    >
                                                        {article.title}
                                                    </Link>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-500/20 truncate">
                                                            {article.categoryName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest italic truncate">
                                                            By {article.authorName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <ArticleStatusBadge status={article.status} />
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <ArticleSourceBadge source={article.source} />
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black text-gray-950 dark:text-white tabular-nums">
                                                    {article.viewCount || 0} <span className="text-[11px] text-gray-400 dark:text-gray-600 ml-1">({article.uniqueViewCount || 0})</span>
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/30 italic">Spectral Reach</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover/row:opacity-100 transition-all duration-300">
                                                {!article.isArchived ? (
                                                    <>
                                                        <Link
                                                            href={`/articles/${article.slug}`}
                                                            target="_blank"
                                                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-blue-600 transition-all"
                                                            title="Preview"
                                                        >
                                                            <Eye size={18} />
                                                        </Link>
                                                        <Link
                                                            href={`/admin/articles/${article._id}/edit`}
                                                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-blue-600 transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleArchive(article._id)}
                                                            className="p-2 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl text-zinc-400 hover:text-amber-600 transition-all"
                                                            title="Archive"
                                                        >
                                                            <Archive size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestore(article._id)}
                                                            className="p-2 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl text-zinc-400 hover:text-green-600 transition-all"
                                                            title="Restore"
                                                        >
                                                            <RotateCcw size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteForever(article._id)}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-600 transition-all"
                                                            title="Delete Forever"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100, x: "-50%", opacity: 0 }}
                        animate={{ y: 0, x: "-50%", opacity: 1 }}
                        exit={{ y: 100, x: "-50%", opacity: 0 }}
                        className="fixed bottom-10 left-1/2 bg-gray-950 dark:bg-black border border-gray-800 dark:border-gray-800 text-white px-8 py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-10 z-50 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Selected</span>
                            <span className="text-xl font-black tabular-nums">{selectedIds.size} <span className="text-xs uppercase text-gray-400">Posts</span></span>
                        </div>

                        <div className="h-10 w-px bg-gray-800" />

                        <div className="flex items-center gap-4">
                            {showArchived ? (
                                <button
                                    onClick={handleBulkRestore}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-lg shadow-blue-900/40 dark:shadow-none"
                                >
                                    <RotateCcw size={14} /> Restore
                                </button>
                            ) : (
                                <button
                                    onClick={handleBulkArchive}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95"
                                >
                                    <Archive size={14} /> Archive
                                </button>
                            )}
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-6 py-2.5 bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-gray-500 hover:text-white transition-all p-2 bg-gray-900 rounded-lg hover:rotate-90 duration-300"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Author Switching Modal */}
            <AnimatePresence>
                {switchingAuthorFor && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSwitchingAuthorFor(null)}
                            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="relative w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-serif font-black tracking-tight text-zinc-950 dark:text-white italic">Switch Author</h2>
                                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.25em] italic">Select new author</p>
                                </div>
                                <button
                                    onClick={() => setSwitchingAuthorFor(null)}
                                    className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-2xl transition-all active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar focus:outline-none">
                                {authors?.map((author) => {
                                    const currentArticle = articles?.find(a => a._id === switchingAuthorFor);
                                    const isCurrent = currentArticle?.authorId === author._id;

                                    return (
                                        <button
                                            key={author._id}
                                            onClick={() => handleSwitchAuthor(author._id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-5 rounded-[1.5rem] transition-all border group relative overflow-hidden",
                                                isCurrent
                                                    ? "bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20"
                                                    : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-100 dark:border-white/5 hover:border-blue-500/30 hover:bg-white dark:hover:bg-zinc-900"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 shadow-sm relative">
                                                    {author.profileImage ? (
                                                        <Image src={author.profileImage} alt={author.name} width={48} height={48} className="object-cover" />
                                                    ) : (
                                                        <Users size={24} className="text-zinc-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-black text-zinc-950 dark:text-white tracking-tight">{author.name}</span>
                                                    <span className="block text-[10px] text-zinc-400 uppercase font-black tracking-widest italic">{author.email}</span>
                                                </div>
                                            </div>
                                            {isCurrent && (
                                                <div className="p-1 px-3 bg-purple-500/20 rounded-full border border-purple-500/30">
                                                    <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-tighter">Current</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setSwitchingAuthorFor(null)}
                                className="w-full mt-10 py-4 text-zinc-400 dark:text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] hover:text-blue-600 dark:hover:text-blue-400 transition-all italic border-t border-zinc-100 dark:border-white/5"
                            >
                                Select an author to update the post
                            </button>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence>
        </div>
    );
}

function MiniStatCard({
    label,
    value,
    icon: Icon,
    color,
    illustration
}: {
    label: string,
    value: string,
    icon: React.ElementType,
    color: 'blue' | 'purple',
    illustration?: string
}) {
    return (
        <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-zinc-100 dark:border-white/5 shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-700 group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            {illustration && (
                <Image
                    src={illustration}
                    alt=""
                    width={80}
                    height={80}
                    className="absolute -bottom-2 -right-2 opacity-[0.08] dark:opacity-[0.04] group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-[0.12] dark:group-hover:opacity-[0.08] transition-all duration-700"
                />
            )}

            <div className="flex items-start justify-between mb-2 relative z-10">
                <div className={cn(
                    "p-3 rounded-2xl border transition-all duration-500 shadow-sm",
                    color === 'purple'
                        ? 'bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white'
                        : 'bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                )}>
                    <Icon size={20} />
                </div>
            </div>

            <div className="relative z-10 space-y-1">
                <p className="text-zinc-400 dark:text-zinc-500 font-black text-[10px] uppercase tracking-[0.25em] group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors italic">{label}</p>
                <h3 className="text-3xl font-serif font-black text-zinc-950 dark:text-white tracking-tighter italic group-hover:scale-110 origin-left transition-all duration-500">{value}</h3>
            </div>
        </div>
    );
}
