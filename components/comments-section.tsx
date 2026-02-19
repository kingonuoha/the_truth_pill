import { useState, useMemo } from "react";
import { Send, Heart, Reply, Loader2, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { getTimeAgo, getAvatarUrl, cn } from "@/lib/utils";

interface Comment {
    _id: Id<"comments">;
    _creationTime: number;
    content: string;
    authorName: string;
    authorImage?: string;
    parentId?: Id<"comments">;
}

interface CommentsSectionProps {
    articleId: Id<"articles">;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
    const { data: session, status } = useSession();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<Comment | null>(null);

    const comments = useQuery(api.engagement.listComments, { articleId });
    const addComment = useMutation(api.engagement.addComment);

    const commentTree = useMemo(() => {
        if (!comments) return [];
        const map = new Map<Id<"comments">, Comment & { replies: CommentItemType[] }>();
        comments.forEach(c => map.set(c._id, { ...c, replies: [] }));

        const tree: CommentItemType[] = [];
        comments.forEach(c => {
            const comment = map.get(c._id)!;
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId)!.replies.unshift(comment); // Push to replies of parent
            } else {
                tree.push(comment);
            }
        });
        return tree;
    }, [comments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== "authenticated") {
            toast.error("Authentication Required", {
                description: "You need to be logged in to post a reflection.",
            });
            return;
        }

        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (!session?.user?.email) return;
            await addComment({
                articleId,
                content,
                userEmail: session.user.email,
                parentId: replyTo?._id
            });
            setContent("");
            setReplyTo(null);
            toast.success(replyTo ? "Reply shared" : "Reflection shared", {
                description: replyTo
                    ? `Your response to ${replyTo.authorName} has been added.`
                    : "Your perspective has been added to the collective.",
            });
        } catch (error: unknown) {
            console.error("Failed to add comment:", error);
            toast.error("Action failed", {
                description: error instanceof Error ? error.message : "Something went wrong while posting.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="comments-section" className="border-t border-zinc-100 pt-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                <div>
                    <h2 className="text-3xl font-serif font-bold mb-2">Collective Reflections</h2>
                    <p className="text-zinc-500 text-sm">Join {comments?.length || 0} truth seekers in deep inquiry.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-full border border-zinc-100 italic text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Discussion
                </div>
            </div>

            {/* Comment Input */}
            <div className="mb-16">
                <form
                    onSubmit={handleSubmit}
                    className={cn(
                        "flex flex-col gap-4 p-8 bg-zinc-50 rounded-[40px] border border-transparent focus-within:border-primary/20 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-primary/5 transition-all duration-500",
                        replyTo && "border-primary/20 bg-white ring-1 ring-primary/10"
                    )}
                >
                    {replyTo && (
                        <div className="flex items-center justify-between bg-primary/5 px-4 py-2 rounded-xl mb-2">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                <Reply size={12} /> Replying to {replyTo.authorName}
                            </div>
                            <button
                                onClick={() => setReplyTo(null)}
                                className="text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm ring-1 ring-zinc-200">
                            <Image
                                src={getAvatarUrl(session?.user?.name || "User", session?.user?.image || undefined)}
                                alt="User"
                                width={48}
                                height={48}
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-6">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={status === "authenticated"
                                    ? (replyTo ? `Write your response to ${replyTo.authorName}...` : "Share your deep insight...")
                                    : "You must be logged in to share..."}
                                className="w-full bg-transparent border-none outline-none focus:ring-0 text-lg font-serif italic text-zinc-800 placeholder:text-zinc-300 resize-none min-h-[100px]"
                                disabled={isSubmitting || status !== "authenticated"}
                            />
                            <div className="flex justify-between items-center bg-white/50 rounded-2xl p-2 pr-3">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 ml-4">Speak your truth with respect</span>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !content.trim() || status !== "authenticated"}
                                    className="px-8 py-3 bg-primary rounded-2xl flex items-center gap-2 text-xs text-white font-black uppercase tracking-wider hover:bg-zinc-900 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>{replyTo ? "Reply" : "Post"} <Send size={16} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Comments List */}
            {comments === undefined ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="font-serif italic">Accessing the collective mind...</p>
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-100">
                    <p className="font-serif italic text-xl text-zinc-400">The silence is deep here. Be the first to break it.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-12">
                    {commentTree.map((c) => (
                        <CommentItem
                            key={c._id}
                            comment={c}
                            onReply={() => {
                                setReplyTo(c);
                                document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

type CommentItemType = Comment & { replies: CommentItemType[] };

function CommentItem({ comment, onReply }: { comment: CommentItemType, onReply: () => void }) {
    return (
        <div className="group relative">
            <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border border-zinc-100 relative shadow-sm group-hover:scale-110 transition-transform duration-500">
                    <Image
                        src={getAvatarUrl(comment.authorName, comment.authorImage)}
                        alt={comment.authorName}
                        width={48}
                        height={48}
                        className="object-cover"
                    />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black uppercase tracking-[0.1em] text-zinc-900">{comment.authorName}</span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest bg-zinc-50 px-2 py-0.5 rounded-full">
                            {getTimeAgo(comment._creationTime)}
                        </span>
                    </div>
                    <div className="relative">
                        <p className="text-zinc-700 leading-relaxed font-serif text-[18px]">
                            {comment.content}
                        </p>
                    </div>
                    <div className="mt-6 flex items-center gap-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-rose-500 transition-colors group/heart">
                            <Heart size={14} className="group-hover/heart:fill-rose-500 transition-colors" /> Love
                        </button>
                        <button
                            onClick={onReply}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors"
                        >
                            <Reply size={14} /> Respond
                        </button>
                    </div>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                        <div className="mt-8 flex flex-col gap-8 border-l-2 border-zinc-50 ml-6 pl-10">
                            {comment.replies.map((reply) => (
                                <div key={reply._id} className="group/reply relative">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-100 relative shadow-sm group-hover/reply:scale-110 transition-transform duration-500">
                                            <Image
                                                src={getAvatarUrl(reply.authorName, reply.authorImage)}
                                                alt={reply.authorName}
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-800">{reply.authorName}</span>
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest bg-zinc-50 px-2 py-0.5 rounded-full">
                                                    {getTimeAgo(reply._creationTime)}
                                                </span>
                                            </div>
                                            <p className="text-zinc-600 leading-relaxed font-serif text-[16px]">
                                                {reply.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
