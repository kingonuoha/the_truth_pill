import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const logPageVisit = mutation({
  args: {
    visitorId: v.string(),
    userId: v.optional(v.id("users")),
    url: v.string(),
    ipAddress: v.string(),
    geoLocation: v.optional(
      v.object({
        country: v.optional(v.string()),
        city: v.optional(v.string()),
      }),
    ),
    device: v.string(),
    browser: v.string(),
    os: v.string(),
    referrer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Update or Create Visitor Tracking
    const tracking = await ctx.db
      .query("visitorTracking")
      .withIndex("by_trackingCode", (q) => q.eq("trackingCode", args.visitorId))
      .unique();

    if (tracking) {
      await ctx.db.patch(tracking._id, {
        lastVisit: now,
        totalVisits: tracking.totalVisits + 1,
        userId: args.userId || tracking.userId,
      });
    } else {
      await ctx.db.insert("visitorTracking", {
        trackingCode: args.visitorId,
        userId: args.userId,
        firstVisit: now,
        lastVisit: now,
        totalVisits: 1,
      });
    }

    // 2. Insert into PageVisits
    await ctx.db.insert("pageVisits", {
      visitorId: args.visitorId,
      userId: args.userId,
      url: args.url,
      ipAddress: args.ipAddress,
      geoLocation: args.geoLocation,
      device: args.device,
      browser: args.browser,
      os: args.os,
      referrer: args.referrer,
      timestamp: now,
    });
  },
});

export const logArticleView = mutation({
  args: {
    articleId: v.id("articles"),
    visitorId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for unique view
    const existingView = await ctx.db
      .query("articleViews")
      .withIndex("by_article_visitor", (q) =>
        q.eq("articleId", args.articleId).eq("visitorId", args.visitorId),
      )
      .unique();

    if (!existingView) {
      const article = await ctx.db.get(args.articleId);
      if (article) {
        await ctx.db.patch(args.articleId, {
          uniqueViewCount: (article.uniqueViewCount || 0) + 1,
          viewCount: (article.viewCount || 0) + 1,
        });
      }
      await ctx.db.insert("articleViews", {
        articleId: args.articleId,
        visitorId: args.visitorId,
        userId: args.userId,
        viewedAt: now,
      });
    } else {
      const article = await ctx.db.get(args.articleId);
      if (article) {
        await ctx.db.patch(args.articleId, {
          viewCount: (article.viewCount || 0) + 1,
        });
      }
    }
  },
});
