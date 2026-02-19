"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessageSquare, Trash2, CheckCircle, Loader2, ExternalLink, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

type CommentData = {
    _id: Id<"comments">;
    articleId: Id<"articles">;
    userId: Id<"users">;
    status: "approved" | "pending" | "spam" | "removed";
    content: string;
    createdAt: number;
    authorName: string;
    authorImage?: string;
    articleTitle: string;
    articleSlug?: string;
};

export default function CommentsPage() {
    const comments = useQuery(api.engagement.listAllComments) as CommentData[] | undefined;
    const updateStatus = useMutation(api.engagement.updateCommentStatus);
    const deleteComment = useMutation(api.engagement.deleteComment);

    const handleStatusUpdate = async (id: Id<"comments">, status: "approved" | "pending" | "spam") => {
        try {
            await updateStatus({ id, status });
            toast.success(`Comment ${status}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: Id<"comments">) => {
        toast("Permanently delete this comment?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await deleteComment({ id });
                        toast.success("Comment deleted");
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to delete");
                    }
                }
            }
        });
    };

    if (!comments) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4 text-blue-600">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-gray-500 font-medium font-sans">Scanning community pulse...</p>
                </div>
            </div>
        );
    }

    const groupedComments = comments.reduce((acc: Record<string, { title: string, slug?: string, comments: CommentData[] }>, comment: CommentData) => {
        const key = comment.articleId as unknown as string;
        if (!acc[key]) {
            acc[key] = {
                title: comment.articleTitle,
                slug: comment.articleSlug,
                comments: []
            };
        }
        acc[key].comments.push(comment);
        return acc;
    }, {});

    const articleIds = Object.keys(groupedComments);

    return (
        <div className="space-y-12 pb-24 font-sans text-gray-950">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tight">Discourse</h1>
                    <p className="text-gray-500 mt-1 font-medium font-sans">Review and moderate community interactions grouped by article.</p>
                </div>
                <div className="px-5 py-2.5 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3 shadow-sm shadow-blue-50">
                    <MessageSquare size={18} className="text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-blue-600">Active Threads: {articleIds.length}</span>
                </div>
            </div>

            <div className="space-y-20">
                {articleIds.map((articleId) => {
                    const group = groupedComments[articleId];
                    const pendingCount = group.comments.filter((c: CommentData) => c.status === "pending").length;

                    return (
                        <div key={articleId} className="relative group/article">
                            {/* Article Header */}
                            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 mb-8 sticky top-4 z-10 shadow-sm hover:border-blue-300 transition-all duration-500">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gray-950 text-white rounded-xl flex items-center justify-center shadow-xl shadow-gray-200 group-hover/article:rotate-6 transition-transform duration-500">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-serif font-black text-gray-950 leading-tight tracking-tight">{group.title}</h2>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">{group.comments.length} Total</span>
                                            {pendingCount > 0 && (
                                                <div className="flex items-center gap-1.5 text-[9px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                                                    {pendingCount} Pending
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {group.slug && (
                                    <Link
                                        href={`/articles/${group.slug}`}
                                        target="_blank"
                                        className="hidden md:flex items-center gap-2.5 px-6 py-3 bg-gray-50 text-gray-950 rounded-xl border border-gray-100 text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                                    >
                                        Inspect Post
                                        <ExternalLink size={14} />
                                    </Link>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:ml-16">
                                {group.comments.map((comment: CommentData) => (
                                    <div key={comment._id} className={cn(
                                        "bg-white p-8 md:p-10 rounded-2xl border transition-all duration-500 group relative overflow-hidden",
                                        comment.status === "pending"
                                            ? "border-blue-200 shadow-xl shadow-blue-500/5 ring-4 ring-blue-50/50"
                                            : "border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
                                    )}>
                                        {comment.status === "pending" && (
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                                        )}

                                        <div className="flex flex-col md:flex-row gap-10">
                                            <div className="flex-1 space-y-8">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-950 font-serif font-black text-lg shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500">
                                                            {comment.authorName?.[0] || 'U'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-serif font-black text-gray-950 tracking-tight">{comment.authorName}</span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-lg border shadow-sm",
                                                        comment.status === "approved" ? "text-green-600 bg-green-50 border-green-100" :
                                                            comment.status === "pending" ? "text-blue-600 bg-blue-50 border-blue-200" :
                                                                "text-red-600 bg-red-50 border-red-100"
                                                    )}>
                                                        {comment.status}
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <div className="absolute top-0 -left-6 bottom-0 w-1 bg-gray-50 rounded-full group-hover:bg-blue-100 transition-colors" />
                                                    <p className="text-gray-700 text-lg leading-relaxed font-serif pl-0 italic">
                                                        &ldquo;{comment.content}&rdquo;
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col gap-4 justify-end items-end pt-4 md:pt-0">
                                                {comment.status !== "approved" && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(comment._id, "approved")}
                                                        className="w-14 h-14 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-500 border border-blue-100 shadow-sm hover:shadow-xl hover:shadow-blue-200 active:scale-90"
                                                        title="Approve Content"
                                                    >
                                                        <CheckCircle size={24} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(comment._id)}
                                                    className="w-14 h-14 flex items-center justify-center bg-gray-50 text-gray-300 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-500 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-red-200 active:scale-90"
                                                    title="Expunge Record"
                                                >
                                                    <Trash2 size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {group.comments.length === 0 && (
                                    <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No active discourse found for this article</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {comments.length === 0 && (
                    <div className="text-center py-40 bg-white rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                            <MessageSquare size={400} className="mx-auto" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                                <ShieldAlert size={40} className="text-gray-200" />
                            </div>
                            <h3 className="text-2xl font-serif font-black text-gray-950 tracking-tight">Archives remain silent.</h3>
                            <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] mt-3">No community interactions require your intervention.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
