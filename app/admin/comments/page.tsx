"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessageSquare, Trash2, CheckCircle, Loader2, ExternalLink } from "lucide-react";
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
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    // Group comments by article
    const groupedComments = (comments || []).reduce((acc: Record<string, { title: string, slug?: string, comments: CommentData[] }>, comment: CommentData) => {
        const key = comment.articleId as unknown as string; // articleId from Convex is an Id, use as string for key
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
        <div className="space-y-12 pb-24">
            <div>
                <h1 className="text-3xl font-serif font-bold text-zinc-900">Comment Moderation</h1>
                <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-widest text-primary">Review and moderate community interactions grouped by article.</p>
            </div>

            <div className="space-y-16">
                {articleIds.map((articleId) => {
                    const group = groupedComments[articleId];
                    const pendingCount = group.comments.filter((c: CommentData) => c.status === "pending").length;

                    return (
                        <div key={articleId} className="relative">
                            {/* Article Header Sticky-ish */}
                            <div className="flex items-center justify-between bg-zinc-50/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-100 mb-6 sticky top-4 z-10 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-200">
                                        <MessageSquare size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-serif font-black text-zinc-900 leading-tight">{group.title}</h2>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{group.comments.length} Total</span>
                                            {pendingCount > 0 && (
                                                <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">
                                                    {pendingCount} Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {group.slug && (
                                    <Link
                                        href={`/articles/${group.slug}`}
                                        target="_blank"
                                        className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white text-zinc-900 rounded-2xl border border-zinc-200 text-xs font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-sm"
                                    >
                                        Inspect Post
                                        <ExternalLink size={14} />
                                    </Link>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 pl-0 md:pl-16">
                                {group.comments.map((comment: CommentData) => (
                                    <div key={comment._id} className={cn(
                                        "bg-white p-8 rounded-[2.5rem] border transition-all group relative overflow-hidden",
                                        comment.status === "pending" ? "border-orange-200 shadow-lg shadow-orange-500/5 ring-4 ring-orange-50" : "border-zinc-100 hover:border-zinc-300"
                                    )}>
                                        <div className="flex flex-col md:flex-row gap-8">
                                            <div className="flex-1 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center text-zinc-900 font-black text-sm shadow-sm">
                                                            {comment.authorName?.[0] || 'U'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-zinc-900">{comment.authorName}</span>
                                                            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight">
                                                                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                                        comment.status === "approved" ? "text-green-600 bg-green-50/50 border-green-100" :
                                                            comment.status === "pending" ? "text-orange-600 bg-orange-50/80 border-orange-200" :
                                                                "text-red-600 bg-red-50/50 border-red-100"
                                                    )}>
                                                        {comment.status}
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-zinc-100 rounded-full" />
                                                    <p className="text-zinc-700 text-base leading-relaxed font-serif pl-4">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col gap-3 justify-end items-end">
                                                {comment.status !== "approved" && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(comment._id, "approved")}
                                                        className="w-12 h-12 flex items-center justify-center bg-white text-green-500 hover:bg-green-500 hover:text-white rounded-2xl transition-all border border-green-100 shadow-sm"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(comment._id)}
                                                    className="w-12 h-12 flex items-center justify-center bg-white text-zinc-300 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-zinc-100 shadow-sm"
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {group.comments.length === 0 && (
                                    <div className="text-center py-12 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-100">
                                        <p className="text-zinc-400 font-bold text-xs">No comments for this article</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {comments.length === 0 && (
                    <div className="text-center py-32 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200">
                        <MessageSquare className="mx-auto text-zinc-200 mb-6" size={64} />
                        <h3 className="text-xl font-serif font-black text-zinc-400">Silence in the archives.</h3>
                        <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mt-2">No comments currently require your attention.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

