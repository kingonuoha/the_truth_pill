import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const initGlobalStats = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if one already exists
    const existing = await ctx.db.query("globalStats").first();

    // Since this is initial setup, we do one expensive read.
    // For articles, we only count non-archived ones.
    const allArticles = await ctx.db.query("articles").collect();
    const activeArticles = allArticles.filter(a => !a.isArchived);
    
    const usersCount = (await ctx.db.query("users").collect()).length;
    const comments = await ctx.db.query("comments").collect();

    const publishedCount = activeArticles.filter((a) => a.status === "published").length;
    const draftCount = activeArticles.filter((a) => a.status === "draft").length;
    const scheduledCount = activeArticles.filter((a) => a.status === "scheduled").length;
    const aiDraftsCount = activeArticles.filter((a) => a.source === "ai" && a.status === "draft").length;

    const pendingCommentsCount = comments.filter((c) => c.status === "pending").length;
    const totalUniqueViews = (await ctx.db.query("visitorTracking").collect()).length;

    // Sum all page visits for total view count
    // Using simple collect() since the dev dataset is small, but theoretically this could be paginated.
    const pageVisits = await ctx.db.query("pageVisits").collect();
    const totalViews = pageVisits.length;

    const statsData = {
      articleCount: activeArticles.length,
      publishedArticleCount: publishedCount,
      draftArticleCount: draftCount,
      scheduledArticleCount: scheduledCount,
      aiDraftCount: aiDraftsCount,
      usersCount,
      commentsCount: comments.length,
      pendingCommentsCount,
      totalViews,
      totalUniqueViews,
    };

    // --- NEW: Recalculate Category articleCounts ---
    const categories = await ctx.db.query("categories").collect();
    for (const category of categories) {
      const count = activeArticles.filter(a => a.categoryId === category._id).length;
      await ctx.db.patch(category._id, { articleCount: count });
    }
    // -----------------------------------------------

    if (existing) {
      await ctx.db.patch(existing._id, statsData);
      return existing._id;
    } else {
      const newId = await ctx.db.insert("globalStats", statsData);
      return newId;
    }
  },
});

export const incrementStats = internalMutation({
  args: {
    update: v.object({
      totalArticles: v.optional(v.number()),
      publishedArticles: v.optional(v.number()),
      draftArticles: v.optional(v.number()),
      scheduledArticles: v.optional(v.number()),
      aiDraftCount: v.optional(v.number()),
      usersCount: v.optional(v.number()),
      commentsCount: v.optional(v.number()),
      pendingCommentsCount: v.optional(v.number()),
      totalViews: v.optional(v.number()),
      totalUniqueViews: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { update }) => {
    const stats = await ctx.db.query("globalStats").first();
    if (!stats) return;

    const patch: Partial<Doc<"globalStats">> = {};
    
    // Map nice field names to schema field names
    if (update.totalArticles !== undefined) patch.articleCount = (stats.articleCount || 0) + update.totalArticles;
    if (update.publishedArticles !== undefined) patch.publishedArticleCount = (stats.publishedArticleCount || 0) + update.publishedArticles;
    if (update.draftArticles !== undefined) patch.draftArticleCount = (stats.draftArticleCount || 0) + update.draftArticles;
    if (update.scheduledArticles !== undefined) patch.scheduledArticleCount = (stats.scheduledArticleCount || 0) + update.scheduledArticles;
    if (update.aiDraftCount !== undefined) patch.aiDraftCount = (stats.aiDraftCount || 0) + update.aiDraftCount;
    if (update.usersCount !== undefined) patch.usersCount = (stats.usersCount || 0) + update.usersCount;
    if (update.commentsCount !== undefined) patch.commentsCount = (stats.commentsCount || 0) + update.commentsCount;
    if (update.pendingCommentsCount !== undefined) patch.pendingCommentsCount = (stats.pendingCommentsCount || 0) + update.pendingCommentsCount;
    if (update.totalViews !== undefined) patch.totalViews = (stats.totalViews || 0) + update.totalViews;
    if (update.totalUniqueViews !== undefined) patch.totalUniqueViews = (stats.totalUniqueViews || 0) + update.totalUniqueViews;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(stats._id, patch);
    }
  },
});
