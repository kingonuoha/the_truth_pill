import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get overall dashboard statistics for the admin overview.
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    // Basic counts
    const articles = await ctx.db.query("articles").collect();
    const usersCount = (await ctx.db.query("users").collect()).length;
    const comments = await ctx.db.query("comments").collect();

    const publishedCount = articles.filter(
      (a) => a.status === "published",
    ).length;
    const draftCount = articles.filter((a) => a.status === "draft").length;
    const scheduledCount = articles.filter(
      (a) => a.status === "scheduled",
    ).length;
    const aiDraftsCount = articles.filter(
      (a) => a.source === "ai" && a.status === "draft",
    ).length;

    const totalReach = (await ctx.db.query("visitorTracking").collect()).length;
    const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);
    const totalUniqueViews = articles.reduce(
      (sum, a) => sum + (a.uniqueViewCount || 0),
      0,
    );
    const pendingCommentsCount = comments.filter(
      (c) => c.status === "pending",
    ).length;

    return {
      articles: {
        total: articles.length,
        published: publishedCount,
        draft: draftCount,
        scheduled: scheduledCount,
        aiDrafts: aiDraftsCount,
      },
      usersCount,
      totalViews,
      totalUniqueViews,
      totalReach,
      pendingCommentsCount,
    };
  },
});

/**
 * Get recent activity feed for the admin dashboard.
 */
export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // 1. Recent comments
    const recentComments = await ctx.db
      .query("comments")
      .order("desc")
      .take(limit);

    // 2. Recent users (signups)
    const recentUsers = await ctx.db.query("users").order("desc").take(limit);

    // 3. Recent articles
    const recentArticles = await ctx.db
      .query("articles")
      .order("desc")
      .take(limit);

    // Combine and sort
    const activities = [
      ...recentComments.map((c) => ({
        id: c._id,
        type: "comment",
        content: `New comment on article`,
        timestamp: c.createdAt,
        articleId: c.articleId,
        userId: c.userId,
      })),
      ...recentUsers.map((u) => ({
        id: u._id,
        type: "signup",
        content: `New user: ${u.name}`,
        timestamp: u.createdAt,
      })),
      ...recentArticles.map((a) => ({
        id: a._id,
        type: "article",
        content: `${a.source === "ai" ? "AI" : "Human"} drafted: ${a.title}`,
        timestamp: a.createdAt,
      })),
    ];

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  },
});

/**
 * List all articles with optional filtering for the admin table.
 */
export const listAllArticles = query({
  args: {
    status: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const articlesQuery = ctx.db.query("articles");

    const articles = await articlesQuery.order("desc").collect();

    let filtered = articles;
    if (args.status && args.status !== "all") {
      filtered = filtered.filter((a) => a.status === args.status);
    }
    if (args.source && args.source !== "all") {
      filtered = filtered.filter((a) => a.source === args.source);
    }

    return await Promise.all(
      filtered.map(async (article) => {
        const author = article.authorId
          ? await ctx.db.get(article.authorId)
          : null;
        const category = article.categoryId
          ? await ctx.db.get(article.categoryId)
          : null;
        return {
          ...article,
          authorName: author?.name || "Unknown",
          categoryName: category?.name || "Uncategorized",
        };
      }),
    );
  },
});
