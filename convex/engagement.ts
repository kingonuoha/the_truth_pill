import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getEngagement = query({
  args: {
    articleId: v.id("articles"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_article_user", (q) => q.eq("articleId", args.articleId))
      .collect();

    const bookmarksCountList = await ctx.db
      .query("bookmarks")
      .filter((q) => q.eq(q.field("articleId"), args.articleId))
      .collect();

    const commentsCountList = await ctx.db
      .query("comments")
      .withIndex("by_articleId", (q) => q.eq("articleId", args.articleId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    let userReaction = null;
    let isBookmarked = false;

    if (args.userEmail) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail!))
        .unique();

      if (user) {
        const reaction = await ctx.db
          .query("reactions")
          .withIndex("by_article_user", (q) =>
            q.eq("articleId", args.articleId).eq("userId", user._id),
          )
          .unique();

        userReaction = reaction?.type || null;

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
      commentsCount: commentsCountList.length,
      bookmarksCount: bookmarksCountList.length,
      userReaction,
      isBookmarked,
    };
  },
});

export const toggleReaction = mutation({
  args: {
    articleId: v.id("articles"),
    userEmail: v.string(),
    type: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("insightful"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
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
  args: {
    articleId: v.id("articles"),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
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
    userEmail: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .unique();
    if (!user) throw new Error("Unauthenticated");

    const commentId = await ctx.db.insert("comments", {
      articleId: args.articleId,
      userId: user._id,
      parentId: args.parentId,
      content: args.content,
      status: "approved",
      createdAt: Date.now(),
    });

    // Notify Admin
    const article = await ctx.db.get(args.articleId);
    await ctx.db.insert("emailQueue", {
      recipient: process.env.ADMIN_EMAIL || "admin@thetruthpill.org",
      subject: `New comment on: ${article?.title || "Unknown Article"}`,
      templateName: "comment_alert",
      templateData: {
        commenterName: user.name,
        articleTitle: article?.title || "Unknown Article",
        commentContent: args.content,
        adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.org"}/admin/comments`,
      },
      status: "pending",
      scheduledFor: Date.now(),
      retries: 0,
    });

    return commentId;
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
export const listAllComments = query({
  args: {},
  handler: async (ctx) => {
    const comments = await ctx.db.query("comments").order("desc").collect();
    return await Promise.all(
      comments.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        const article = await ctx.db.get(c.articleId);
        return {
          ...c,
          authorName: user?.name || "Unknown",
          authorImage: user?.profileImage,
          articleTitle: article?.title || "Deleted Article",
          articleSlug: article?.slug,
        };
      }),
    );
  },
});

export const updateCommentStatus = mutation({
  args: {
    id: v.id("comments"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("spam"),
      v.literal("removed"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (user?.role !== "admin") throw new Error("Forbidden");

    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const deleteComment = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
