"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Heart,
    Bookmark as BookmarkIcon,
    MessageCircle,
    Share2,
    ThumbsUp,
    Lightbulb,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

interface EngagementToolbarProps {
    articleId: Id<"articles">;
    slug: string;
    vertical?: boolean;
}

export function EngagementToolbar({ articleId, slug, vertical = false }: EngagementToolbarProps) {
    const { data: session, status } = useSession();
    const engagement = useQuery(api.engagement.getEngagement, {
        articleId,
        userEmail: session?.user?.email || undefined
    });

    const toggleReaction = useMutation(api.engagement.toggleReaction);
    const toggleBookmark = useMutation(api.engagement.toggleBookmark);

    const [isBookmarking, setIsBookmarking] = useState(false);
    const [showReactions, setShowReactions] = useState(false);

    const triggerHaptic = (pattern: number | number[] = 10) => {
        if (typeof window !== "undefined" && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        }
    };

    const handleReaction = async (type: "like" | "love" | "insightful") => {
        triggerHaptic(engagement?.userReaction === type ? [5, 5] : 10);
        if (status !== "authenticated") {
            toast.error("Authentication Required", {
                description: "You need to be logged in to react to articles.",
            });
            return;
        }

        try {
            if (!session?.user?.email) return;
            await toggleReaction({
                articleId,
                type,
                userEmail: session.user.email
            });

            const action = engagement?.userReaction === type ? "Removed" : "Added";
            toast.success(`${action} ${type} reaction`, {
                icon: type === "like" ? <ThumbsUp size={14} /> : type === "love" ? <Heart size={14} /> : <Lightbulb size={14} />,
            });
        } catch (error: unknown) {
            toast.error("Action failed", {
                description: error instanceof Error ? error.message : "Something went wrong",
            });
        } finally {
            setShowReactions(false);
        }
    };

    const handleBookmark = async () => {
        if (status !== "authenticated") {
            toast.error("Authentication Required", {
                description: "You need to be logged in to save articles.",
            });
            return;
        }

        setIsBookmarking(true);
        triggerHaptic(20);
        try {
            if (!session?.user?.email) return;
            const result = await toggleBookmark({
                articleId,
                userEmail: session.user.email
            });
            toast.success(result ? "Article saved" : "Bookmark removed", {
                description: result ? "You can find this in your saved truths." : "Article removed from your bookmarks.",
            });
        } catch (error: unknown) {
            toast.error("Action failed", {
                description: error instanceof Error ? error.message : "Something went wrong",
            });
        } finally {
            setIsBookmarking(false);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/articles/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied", {
            description: "The article link has been copied to your clipboard.",
        });
    };

    if (!engagement) return (
        <div className="flex items-center gap-6 py-4 animate-pulse">
            <div className="h-4 w-20 bg-zinc-100 rounded" />
            <div className="h-4 w-20 bg-zinc-100 rounded" />
        </div>
    );

    return (
        <div className={cn(
            "flex items-center bg-white/80 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 shadow-xl backdrop-blur-xl transition-all duration-500",
            vertical
                ? "flex-col gap-8 p-4 rounded-full"
                : "fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-auto md:static md:translate-x-0 md:justify-between px-8 py-4 rounded-3xl z-50 transform-gpu"
        )}>
            <div className={cn(
                "flex items-center",
                vertical ? "flex-col gap-6" : "flex-row gap-8"
            )}>
                {/* Reactions */}
                <div className="relative">
                    <motion.button
                        onMouseEnter={() => setShowReactions(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9, rotate: -5 }}
                        className={cn(
                            "flex items-center transition-all group",
                            vertical ? "flex-col gap-1.5" : "flex-row gap-2.5",
                            engagement.userReaction === "love" ? "text-rose-500" :
                                engagement.userReaction === "like" ? "text-sky-500" :
                                    engagement.userReaction === "insightful" ? "text-amber-500" : ""
                        )}
                    >
                        <div className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-500 group-hover:text-primary">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={engagement.userReaction || "none"}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                    {engagement.userReaction === "love" ? (
                                        <Heart size={vertical ? 22 : 20} className="fill-current text-rose-500" />
                                    ) : engagement.userReaction === "insightful" ? (
                                        <Lightbulb size={vertical ? 22 : 20} className="fill-current text-amber-500" />
                                    ) : (
                                        <ThumbsUp size={vertical ? 22 : 20} className={cn(engagement.userReaction === "like" && "fill-current text-sky-500")} />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <span className={cn(
                            "font-black",
                            !engagement.userReaction && "text-zinc-500",
                            vertical ? "text-[11px]" : "text-sm"
                        )}>
                            {engagement.totalReactions}
                        </span>
                    </motion.button>

                    <AnimatePresence>
                        {showReactions && (
                            <motion.div
                                initial={vertical ? { opacity: 0, x: -10, scale: 0.9 } : { opacity: 0, y: 10, scale: 0.9 }}
                                animate={vertical ? { opacity: 1, x: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
                                exit={vertical ? { opacity: 0, x: -5, scale: 0.9 } : { opacity: 0, y: 5, scale: 0.9 }}
                                onMouseLeave={() => setShowReactions(false)}
                                className={cn(
                                    "absolute bg-white shadow-2xl rounded-full border border-zinc-100 z-[100]",
                                    vertical
                                        ? "left-full top-0 ml-4 px-2 py-6 flex flex-col items-center gap-4"
                                        : "bottom-full left-0 mb-4 px-6 py-2 flex flex-row items-center gap-6"
                                )}
                            >
                                <ReactionButton
                                    icon={<ThumbsUp size={18} />}
                                    label="like"
                                    active={engagement.userReaction === "like"}
                                    onClick={() => handleReaction("like")}
                                    activeColor="text-sky-500 bg-sky-50"
                                />
                                <ReactionButton
                                    icon={<Heart size={18} />}
                                    label="love"
                                    active={engagement.userReaction === "love"}
                                    onClick={() => handleReaction("love")}
                                    activeColor="text-rose-500 bg-rose-50"
                                />
                                <ReactionButton
                                    icon={<Lightbulb size={18} />}
                                    label="insightful"
                                    active={engagement.userReaction === "insightful"}
                                    onClick={() => handleReaction("insightful")}
                                    activeColor="text-amber-500 bg-amber-50"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Comments Link */}
                <button
                    onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className={cn(
                        "flex items-center text-zinc-500 hover:text-sky-blue transition-colors group",
                        vertical ? "flex-col gap-1.5" : "flex-row gap-2.5"
                    )}
                >
                    <div className="p-2 rounded-full hover:bg-zinc-50 transition-colors">
                        <MessageCircle size={vertical ? 22 : 20} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <span className={cn(
                        "font-black",
                        vertical ? "text-[11px]" : "text-sm"
                    )}>
                        {engagement.commentsCount}
                    </span>
                </button>

                {/* Bookmark */}
                <button
                    onClick={handleBookmark}
                    disabled={isBookmarking}
                    className={cn(
                        "flex items-center transition-all group",
                        vertical ? "flex-col gap-1.5" : "flex-row gap-2.5",
                        engagement.isBookmarked ? "text-primary" : "text-zinc-500 hover:text-primary"
                    )}
                >
                    <div className="p-2 rounded-full hover:bg-zinc-50 transition-colors">
                        {isBookmarking ? (
                            <Loader2 size={vertical ? 22 : 20} className="animate-spin" />
                        ) : (
                            <BookmarkIcon size={vertical ? 22 : 20} className={cn("group-hover:scale-110 transition-transform", engagement.isBookmarked && "fill-current")} />
                        )}
                    </div>
                    <span className={cn(
                        "font-black",
                        vertical ? "text-[11px]" : "text-sm"
                    )}>
                        {engagement.bookmarksCount}
                    </span>
                </button>
            </div>

            <div className={cn(
                "bg-zinc-100",
                vertical ? "w-8 h-[1px] my-2" : "w-[1px] h-6 mx-2"
            )} />

            <button
                onClick={handleShare}
                className={cn(
                    "flex items-center text-zinc-400 hover:text-primary transition-all group",
                    vertical ? "flex-col gap-1.5" : "flex-row gap-2.5"
                )}
                title="Share Truth"
            >
                <div className="p-2 rounded-full hover:bg-zinc-50 transition-colors">
                    <Share2 size={vertical ? 20 : 18} className="group-hover:rotate-12 transition-transform" />
                </div>
                {vertical ? (
                    <span className="text-[9px] font-black uppercase tracking-tighter">Share</span>
                ) : (
                    <span className="text-xs font-black uppercase tracking-widest">Share Truth</span>
                )}
            </button>
        </div>
    );
}

function ReactionButton({ icon, label, onClick, active, activeColor }: { icon: React.ReactNode, label: string, onClick: () => void, active: boolean, activeColor: string }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={cn(
                "p-2 rounded-full transition-all hover:scale-125 active:scale-90",
                active ? activeColor : "text-zinc-400 hover:text-zinc-600"
            )}
        >
            {icon}
        </button>
    );
}
