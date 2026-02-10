"use client";

import { useState } from "react";
import { User, Send, Heart, Reply, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { toast } from "sonner";

interface CommentsSectionProps {
    articleId: Id<"articles">;
}

interface Comment {
    _id: Id<"comments">;
    _creationTime: number;
    content: string;
    authorName: string;
    authorImage?: string;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const comments = useQuery(api.engagement.listComments, { articleId });
    const addComment = useMutation(api.engagement.addComment);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await addComment({ articleId, content });
            setContent("");
            toast.success("Reflection posted successfully");
        } catch (error: unknown) {
            console.error("Failed to add comment:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to post reflection";
            if (errorMessage.includes("Unauthenticated")) {
                toast.error("Please login to post a reflection");
            } else {
                toast.error("Failed to post reflection");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="comments" className="border-t border-zinc-100 pt-16">
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-serif font-bold">Reflections ({comments?.length || 0})</h2>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Sorted by Best
                </div>
            </div>

            {/* Comment Input */}
            <div className="mb-12">
                <form
                    onSubmit={handleSubmit}
                    className="flex gap-4 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 focus-within:border-sky-blue/30 focus-within:bg-white transition-all duration-300"
                >
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex-shrink-0 flex items-center justify-center">
                        <User size={20} className="text-zinc-400" />
                    </div>
                    <div className="flex-1 flex flex-col gap-4">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your perspective..."
                            className="w-full bg-transparent border-none outline-none focus:ring-0 text-zinc-800 placeholder:text-zinc-400 resize-none min-h-[80px]"
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || !content.trim()}
                                className="px-6 py-2 bg-primary rounded-xl flex items-center gap-2 text-sm text-white font-bold disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Post Reflection"}
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Comments List */}
            {comments === undefined ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-sky-blue opacity-50" />
                </div>
            ) : (
                <div className="flex flex-col gap-10">
                    {comments.map((c: Comment) => (
                        <div key={c._id} className="group">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-100">
                                    {c.authorImage ? (
                                        <Image src={c.authorImage} alt={c.authorName} width={40} height={40} className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                            <User size={20} className="text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-sm font-black uppercase tracking-tighter text-zinc-900">{c.authorName}</span>
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                            {new Date(c._creationTime).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-zinc-700 leading-relaxed font-serif text-[17px] mb-4">
                                        {c.content}
                                    </p>
                                    <div className="flex items-center gap-6">
                                        <button className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors">
                                            <Heart size={14} /> 0
                                        </button>
                                        <button className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-sky-blue transition-colors">
                                            <Reply size={14} /> Reply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
