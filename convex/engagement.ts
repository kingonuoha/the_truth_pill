import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getEngagement = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_article_user", (q) => q.eq("articleId", args.articleId))
      .collect();

    const bookmarksCount = await ctx.db
      .query("bookmarks")
      .filter((q) => q.eq(q.field("articleId"), args.articleId))
      .collect();

    const commentsCount = await ctx.db
      .query("comments")
      .withIndex("by_articleId", (q) => q.eq("articleId", args.articleId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const identity = await ctx.auth.getUserIdentity();
    let userReaction = null;
    let isBookmarked = false;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .unique();

      if (user) {
        userReaction = await ctx.db
          .query("reactions")
          .withIndex("by_article_user", (q) =>
            q.eq("articleId", args.articleId).eq("userId", user._id),
          )
          .unique();

        const bookmark = await ctx.db
          .query("bookmarks")
          .withIndex("by_user_article", (q) =>
            q.eq("userId", user._id).eq("articleId", args.articleId),
          )
          .unique();

        isBookmarked = !!bookmark;
      }
    }

    return {
      likeCount: reactions.filter((r) => r.type === "like").length,
      loveCount: reactions.filter((r) => r.type === "love").length,
      insightfulCount: reactions.filter((r) => r.type === "insightful").length,
      totalReactions: reactions.length,
      commentsCount: commentsCount.length,
      bookmarksCount: bookmarksCount.length,
      userReaction: userReaction?.type || null,
      isBookmarked,
    };
  },
});

export const toggleReaction = mutation({
  args: {
    articleId: v.id("articles"),
    type: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("insightful"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_article_user", (q) =>
        q.eq("articleId", args.articleId).eq("userId", user._id),
      )
      .unique();

    if (existing) {
      if (existing.type === args.type) {
        await ctx.db.delete(existing._id);
      } else {
        await ctx.db.patch(existing._id, { type: args.type });
      }
    } else {
      await ctx.db.insert("reactions", {
        articleId: args.articleId,
        userId: user._id,
        type: args.type,
        createdAt: Date.now(),
      });
    }
  },
});

export const toggleBookmark = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_article", (q) =>
        q.eq("userId", user._id).eq("articleId", args.articleId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("bookmarks", {
        userId: user._id,
        articleId: args.articleId,
        createdAt: Date.now(),
      });
      return true;
    }
  },
});
export const addComment = mutation({
  args: {
    articleId: v.id("articles"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("Unauthenticated");

    return await ctx.db.insert("comments", {
      articleId: args.articleId,
      userId: user._id,
      parentId: args.parentId,
      content: args.content,
      status: "approved",
      createdAt: Date.now(),
    });
  },
});

export const listComments = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_articleId", (q) => q.eq("articleId", args.articleId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .order("desc")
      .collect();

    return await Promise.all(
      comments.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return {
          ...c,
          authorName: user?.name || "Unknown",
          authorImage: user?.profileImage,
        };
      }),
    );
  },
});
