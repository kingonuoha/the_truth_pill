"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Archive, Edit2, Eye, FileText,
    Plus, RotateCcw, Search, Trash2, X, Sparkles, Clock
} from "lucide-react";
import { ArticleStatusBadge, ArticleSourceBadge } from "@/components/admin/article-badges";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";

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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                    <p className="text-gray-500 font-medium font-sans">Syncing articles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-gray-950 tracking-tight">Library</h1>
                    <p className="text-gray-500 mt-1 font-medium font-sans">Manage your stories, drafts, and AI-assisted pieces.</p>
                </div>
                <Link
                    href="/admin/articles/new"
                    className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-95 shadow-lg shadow-purple-100"
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
                    value={(stats.totalViews / 1000).toFixed(1) + "k"} 
                    icon={Eye} 
                    color="blue" 
                    illustration="/illustrations/Visual-data.svg"
                />
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title, author, or category..."
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium text-sm text-gray-950 placeholder:text-gray-400"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all active:scale-95",
                            showArchived
                                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        {showArchived ? <RotateCcw size={16} /> : <Archive size={16} />}
                        {showArchived ? "Active Feed" : "Archived"}
                    </button>

                    <div className="h-8 w-px bg-gray-100 hidden md:block mx-1" />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-[0.1em] text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none cursor-pointer pr-10 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjOTQ5NGEyIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
                    >
                        <option value="all">Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                    </select>

                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-[0.1em] text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none cursor-pointer pr-10 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjOTQ5NGEyIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
                    >
                        <option value="all">Origin</option>
                        <option value="human">Human</option>
                        <option value="ai">AI Generated</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-5 w-14 text-center">
                                <input
                                    type="checkbox"
                                    checked={articles?.length > 0 && selectedIds.size === articles?.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 h-4 w-4 cursor-pointer"
                                />
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Content</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 text-center">Status</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 text-center">Origin</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 text-center">Audience</th>
                            <th className="px-6 py-5 text-right w-32"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {articles.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-20 text-center text-gray-400">
                                    <FileText className="mx-auto mb-4 opacity-10" size={64} />
                                    <p className="font-bold text-gray-500 uppercase tracking-widest text-xs">Zero articles discovered</p>
                                    <p className="text-gray-400 text-[11px] mt-1">Try adjusting your spectral filters</p>
                                </td>
                            </tr>
                        )}
                        {articles.map((article) => (
                            <tr key={article._id} className={cn(
                                "hover:bg-gray-50/50 transition-all duration-300 group cursor-default",
                                selectedIds.has(article._id) && "bg-blue-50/30"
                            )}>
                                <td className="px-6 py-5 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(article._id)}
                                        onChange={() => toggleSelectOne(article._id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 h-4 w-4 cursor-pointer"
                                    />
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden relative flex-shrink-0 border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                                            <Image
                                                src={article.coverImage || `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&h=100&fit=crop`}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <Link 
                                                    href={`/admin/articles/${article._id}/edit`}
                                                    className="font-serif font-black text-gray-950 group-hover:text-blue-600 transition-colors line-clamp-1 text-base tracking-tight"
                                                >
                                                    {article.title}
                                                </Link>
                                                {article.isArchived && (
                                                    <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-1.5 py-0.5 rounded-lg border border-amber-100 uppercase tracking-wider">Archived</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                    {article.categoryName}
                                                </span>
                                                <span className="text-gray-300 text-[10px]">•</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                                    By {article.authorName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <ArticleStatusBadge status={article.status} />
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <ArticleSourceBadge source={article.source} />
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-lg font-black text-gray-950 tracking-tight">{article.viewCount || 0}</span>
                                        <span className="text-[9px] text-gray-400 uppercase font-black tracking-[0.1em]">Impact</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-1.5 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        {!article.isArchived && (
                                            <>
                                                <Link
                                                    href={`/articles/${article.slug}`}
                                                    target="_blank"
                                                    className="p-2.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 transition-all active:scale-90"
                                                    title="Beam Preview"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <Link
                                                    href={`/admin/articles/${article._id}/edit`}
                                                    className="p-2.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 transition-all active:scale-90"
                                                    title="Refine Content"
                                                >
                                                    <Edit2 size={18} />
                                                </Link>
                                            </>
                                        )}

                                        {article.isArchived ? (
                                            <>
                                                <button
                                                    onClick={() => handleRestore(article._id)}
                                                    className="p-2.5 hover:bg-green-50 rounded-xl text-gray-400 hover:text-green-600 transition-all active:scale-90"
                                                    title="Resurrect"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteForever(article._id)}
                                                    className="p-2.5 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-all active:scale-90"
                                                    title="Erase Forever"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleArchive(article._id)}
                                                className="p-2.5 hover:bg-amber-50 rounded-xl text-gray-400 hover:text-amber-600 transition-all active:scale-90"
                                                title="Chronicle (Archive)"
                                            >
                                                <Archive size={18} />
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
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div 
                        initial={{ y: 100, x: "-50%", opacity: 0 }}
                        animate={{ y: 0, x: "-50%", opacity: 1 }}
                        exit={{ y: 100, x: "-50%", opacity: 0 }}
                        className="fixed bottom-10 left-1/2 bg-gray-950 border border-gray-800 text-white px-8 py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-10 z-50 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
                        
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Selection</span>
                            <span className="text-xl font-black tabular-nums">{selectedIds.size} <span className="text-xs uppercase text-gray-400">Items</span></span>
                        </div>

                        <div className="h-10 w-px bg-gray-800" />

                        <div className="flex items-center gap-4">
                            {showArchived ? (
                                <button
                                    onClick={handleBulkRestore}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-lg shadow-blue-900/40"
                                >
                                    <RotateCcw size={14} /> Resurrect
                                </button>
                            ) : (
                                <button
                                    onClick={handleBulkArchive}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95"
                                >
                                    <Archive size={14} /> Chronicle
                                </button>
                            )}
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-6 py-2.5 bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95"
                            >
                                <Trash2 size={14} /> Erase
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
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group relative overflow-hidden">
            {illustration && (
                <Image 
                    src={illustration} 
                    alt="" 
                    width={70} 
                    height={70} 
                    className="absolute -bottom-1 -right-1 opacity-[0.06] group-hover:scale-110 group-hover:opacity-[0.08] transition-all duration-500" 
                />
            )}
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={cn(
                    "p-2 rounded-lg border transition-colors", 
                    color === 'purple' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                )}>
                    <Icon size={18} />
                </div>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-2xl font-extrabold text-gray-950 tracking-tight mb-1">{value}</h3>
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.1em]">{label}</p>
            </div>
        </div>
    );
}
