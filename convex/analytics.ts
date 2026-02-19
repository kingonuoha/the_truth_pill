import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    // Check for existing view record
    const existingView = await ctx.db
      .query("articleViews")
      .withIndex("by_article_visitor", (q) =>
        q.eq("articleId", args.articleId).eq("visitorId", args.visitorId),
      )
      .unique();

    const article = await ctx.db.get(args.articleId);
    if (!article) return;

    if (!existingView) {
      // 1. BRAND NEW UNIQUE VIEW
      await ctx.db.patch(args.articleId, {
        uniqueViewCount: (article.uniqueViewCount || 0) + 1,
        viewCount: (article.viewCount || 0) + 1,
      });

      await ctx.db.insert("articleViews", {
        articleId: args.articleId,
        visitorId: args.visitorId,
        userId: args.userId,
        viewedAt: now,
      });
    } else {
      // 2. RETURNING VISITOR
      // Only increase viewCount if last view was more than 24 hours ago (prevent spam/refresh inflation)
      const COOLDOWN = 24 * 60 * 60 * 1000;
      if (now - existingView.viewedAt > COOLDOWN) {
        await ctx.db.patch(args.articleId, {
          viewCount: (article.viewCount || 0) + 1,
        });

        // Update the timestamp so the cooldown resets
        await ctx.db.patch(existingView._id, {
          viewedAt: now,
          userId: args.userId || existingView.userId, // Update UID if they just logged in
        });
      }
    }
  },
});

export const getTrafficStats = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;
    const prevStartTime = startTime - days * 24 * 60 * 60 * 1000;

    const currentVisits = await ctx.db
      .query("pageVisits")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", startTime))
      .collect();

    const prevVisits = await ctx.db
      .query("pageVisits")
      .withIndex("by_timestamp", (q) =>
        q.gt("timestamp", prevStartTime).lt("timestamp", startTime),
      )
      .collect();

    // Group by day for the chart
    const stats: Record<string, { date: string; visits: number }> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(now - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      stats[dateKey] = { date: dateKey, visits: 0 };
    }

    currentVisits.forEach((v) => {
      const dateKey = new Date(v.timestamp).toISOString().split("T")[0];
      if (stats[dateKey]) {
        stats[dateKey].visits++;
      }
    });

    // Calculate Trend
    const currentCount = currentVisits.length;
    const prevCount = prevVisits.length;
    const trend =
      prevCount === 0 ? 100 : ((currentCount - prevCount) / prevCount) * 100;

    return {
      chartData: Object.values(stats),
      totalVisits: currentCount,
      trend: trend.toFixed(1),
      isTrendUp: trend >= 0,
    };
  },
});

export const getReferrerStats = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const visits = await ctx.db
      .query("pageVisits")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", startTime))
      .collect();

    const referrers: Record<string, number> = {};

    visits.forEach((v) => {
      const ref = v.referrer;
      let domain = "Direct / Bookmark";

      if (ref && ref !== "") {
        try {
          domain = new URL(ref).hostname;
        } catch {
          domain = "External Link";
        }
      }

      referrers[domain] = (referrers[domain] || 0) + 1;
    });

    return Object.entries(referrers)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  },
});

export const getGeographicStats = query({
  handler: async (ctx) => {
    const visits = await ctx.db.query("pageVisits").collect();
    const counts: Record<string, { country: string; count: number }> = {};

    visits.forEach((v) => {
      const country = v.geoLocation?.country || "Unknown";
      if (!counts[country]) {
        counts[country] = { country, count: 0 };
      }
      counts[country].count++;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  },
});

export const getDeviceStats = query({
  handler: async (ctx) => {
    const visits = await ctx.db.query("pageVisits").collect();
    const devices: Record<string, number> = {
      mobile: 0,
      tablet: 0,
      desktop: 0,
    };
    const browsers: Record<string, number> = {};
    const oss: Record<string, number> = {};

    visits.forEach((v) => {
      devices[v.device as keyof typeof devices]++;
      browsers[v.browser] = (browsers[v.browser] || 0) + 1;
      oss[v.os] = (oss[v.os] || 0) + 1;
    });

    return {
      devices: Object.entries(devices).map(([name, value]) => ({
        name,
        value,
      })),
      browsers: Object.entries(browsers).map(([name, value]) => ({
        name,
        value,
      })),
      oss: Object.entries(oss).map(([name, value]) => ({ name, value })),
    };
  },
});

export const getTopContent = query({
  handler: async (ctx) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const stats = await Promise.all(
      articles.map(async (a) => {
        const reactions = await ctx.db
          .query("reactions")
          .withIndex("by_article_user", (q) => q.eq("articleId", a._id))
          .collect();

        const avgReadTime =
          a.actualReadingTime && a.uniqueViewCount > 0
            ? Math.round(a.actualReadingTime / a.uniqueViewCount)
            : 0;

        return {
          id: a._id,
          title: a.title,
          views: a.viewCount,
          uniqueViews: a.uniqueViewCount,
          reactions: reactions.length,
          avgReadTime, // in seconds
          engagementRate:
            a.uniqueViewCount > 0
              ? (reactions.length / a.uniqueViewCount) * 100
              : 0,
        };
      }),
    );

    return stats.sort((a, b) => b.uniqueViews - a.uniqueViews).slice(0, 10);
  },
});

export const logHeartbeat = mutation({
  args: {
    articleId: v.id("articles"),
    visitorId: v.string(),
    seconds: v.number(),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (!article) return;

    // Update aggregate
    await ctx.db.patch(args.articleId, {
      actualReadingTime: (article.actualReadingTime || 0) + args.seconds,
    });

    // Update session record
    const view = await ctx.db
      .query("articleViews")
      .withIndex("by_article_visitor", (q) =>
        q.eq("articleId", args.articleId).eq("visitorId", args.visitorId),
      )
      .unique();

    if (view) {
      await ctx.db.patch(view._id, {
        engagementTime: (view.engagementTime || 0) + args.seconds,
      });
    }
  },
});

export const getRealTimeActivity = query({
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const latestVisits = await ctx.db
      .query("pageVisits")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", oneHourAgo))
      .order("desc")
      .take(100);

    // Group by visitorId and take the latest one for each to show unique active sessions
    const uniqueVisitors = new Map<string, (typeof latestVisits)[0]>();
    latestVisits.forEach((v) => {
      if (!uniqueVisitors.has(v.visitorId)) {
        uniqueVisitors.set(v.visitorId, v);
      }
    });

    return Array.from(uniqueVisitors.values());
  },
});
