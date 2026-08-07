import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/**
 * Get overall dashboard statistics for the admin overview.
 */
/**
 * Get overall dashboard statistics for the admin overview.
 * Uses the pre-calculated globalStats counter document to prevent full table scans.
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("globalStats").first();
    
    if (!stats) {
      return {
        articles: { total: 0, published: 0, draft: 0, scheduled: 0, aiDrafts: 0 },
        usersCount: 0,
        totalViews: 0,
        totalUniqueViews: 0,
        totalReach: 0,
        pendingCommentsCount: 0,
      };
    }

    return {
      articles: {
        total: stats.articleCount,
        published: stats.publishedArticleCount,
        draft: stats.draftArticleCount,
        scheduled: stats.scheduledArticleCount,
        aiDrafts: stats.aiDraftCount,
      },
      usersCount: stats.usersCount,
      totalViews: stats.totalViews,
      totalUniqueViews: stats.totalUniqueViews,
      totalReach: 0, // visitorTracking is too large to .collect(), needs a counter
      pendingCommentsCount: stats.pendingCommentsCount,
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
 * One-off data fix: collapse duplicate published articles that share a slug.
 * Keeps the doc with the higher viewCount (tie-break: longer content),
 * repoints articleViews/reactions/comments to the kept doc, sums the view
 * counters, then deletes the losers.
 */
export const adminDedupeArticles = mutation({
  args: {},
  handler: async (ctx) => {
    const allArticles = await ctx.db.query("articles").collect();

    const bySlug = new Map<string, Doc<"articles">[]>();
    for (const a of allArticles) {
      if (a.status !== "published") continue;
      const list = bySlug.get(a.slug) || [];
      list.push(a);
      bySlug.set(a.slug, list);
    }

    const dedupedSlugs: string[] = [];

    for (const [slug, docs] of bySlug) {
      if (docs.length < 2) continue;

      docs.sort((a, b) => {
        const viewDiff = (b.viewCount || 0) - (a.viewCount || 0);
        if (viewDiff !== 0) return viewDiff;
        return (b.content?.length || 0) - (a.content?.length || 0);
      });

      const keep = docs[0];
      const dupes = docs.slice(1);

      for (const dup of dupes) {
        const views = await ctx.db
          .query("articleViews")
          .withIndex("by_article_visitor", (q) => q.eq("articleId", dup._id))
          .collect();
        for (const row of views) {
          await ctx.db.patch(row._id, { articleId: keep._id });
        }

        const reactions = await ctx.db
          .query("reactions")
          .withIndex("by_article_user", (q) => q.eq("articleId", dup._id))
          .collect();
        for (const r of reactions) {
          await ctx.db.patch(r._id, { articleId: keep._id });
        }

        const comments = await ctx.db
          .query("comments")
          .withIndex("by_articleId", (q) => q.eq("articleId", dup._id))
          .collect();
        for (const c of comments) {
          await ctx.db.patch(c._id, { articleId: keep._id });
        }

        await ctx.db.patch(keep._id, {
          viewCount: (keep.viewCount || 0) + (dup.viewCount || 0),
          uniqueViewCount: (keep.uniqueViewCount || 0) + (dup.uniqueViewCount || 0),
          reactionsCount: (keep.reactionsCount || 0) + (dup.reactionsCount || 0),
        });

        await ctx.db.delete(dup._id);
      }

      dedupedSlugs.push(slug);
    }

    return { dedupedSlugs };
  },
});
