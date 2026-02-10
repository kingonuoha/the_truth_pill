"use client";

import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface EngagementToolbarProps {
    articleId: Id<"articles">;
}

export function EngagementToolbar({ articleId }: EngagementToolbarProps) {
    const { status } = useSession();
    const engagement = useQuery(api.engagement.getEngagement, { articleId });
    const toggleReaction = useMutation(api.engagement.toggleReaction);
    const toggleBookmark = useMutation(api.engagement.toggleBookmark);

    const handleReaction = async () => {
        if (status !== "authenticated") {
            toast.error("Please login to react to articles");
            return;
        }

        try {
            await toggleReaction({ articleId, type: "like" });
            toast.success("Reaction updated");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update reaction";
            if (errorMessage.includes("Unauthenticated")) {
                toast.error("Please login to react to articles");
            } else {
                toast.error("Failed to update reaction");
            }
        }
    };

    const handleBookmark = async () => {
        if (status !== "authenticated") {
            toast.error("Please login to bookmark articles");
            return;
        }

        try {
            const isBookmarked = await toggleBookmark({ articleId });
            toast.success(isBookmarked ? "Article bookmarked" : "Bookmark removed");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update bookmark";
            if (errorMessage.includes("Unauthenticated")) {
                toast.error("Please login to bookmark articles");
            } else {
                toast.error("Failed to update bookmark");
            }
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href
            }).then(() => {
                toast.success("Shared successfully");
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard");
        }
    };

    return (
        <div className="flex lg:flex-col items-center gap-4 py-4">
            <button
                onClick={handleReaction}
                className={`p-3 rounded-full transition-all active:scale-95 flex flex-col items-center ${engagement?.userReaction === "like"
                    ? "bg-red-50 text-red-500"
                    : "hover:bg-zinc-100 text-zinc-400"
                    }`}
            >
                <Heart size={22} fill={engagement?.userReaction === "like" ? "currentColor" : "none"} />
                <span className="text-[10px] font-bold mt-1">
                    {engagement?.totalReactions || 0}
                </span>
            </button>

            <button
                onClick={handleBookmark}
                className={`p-3 rounded-full transition-all active:scale-95 ${engagement?.isBookmarked
                    ? "bg-sky-50 text-sky-blue"
                    : "hover:bg-zinc-100 text-zinc-400"
                    }`}
            >
                <Bookmark size={22} fill={engagement?.isBookmarked ? "currentColor" : "none"} />
            </button>

            <button
                onClick={handleShare}
                className="p-3 rounded-full hover:bg-zinc-100 text-zinc-400 transition-all active:scale-95"
            >
                <Share2 size={22} />
            </button>

            <div className="w-8 h-[1px] bg-zinc-100 lg:my-2 hidden lg:block" />

            <a
                href="#comments"
                className="p-3 rounded-full hover:bg-zinc-100 text-zinc-400 transition-all active:scale-95 flex flex-col items-center"
            >
                <MessageCircle size={22} />
                <span className="text-[10px] font-bold mt-1">
                    {engagement?.commentsCount || 0}
                </span>
            </a>
        </div>
    );
}
