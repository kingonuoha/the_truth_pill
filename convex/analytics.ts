import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";

// Non-public routes (admin, auth flows) should not inflate globalStats.
const isPublicRoute = (url: string): boolean =>
  !/(^|\/)(admin|dashboard|login|signup|auth)(\/|$)/.test(url);

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

    let isNewVisitor = false;
    if (tracking) {
      await ctx.db.patch(tracking._id, {
        lastVisit: now,
        totalVisits: tracking.totalVisits + 1,
        userId: args.userId || tracking.userId,
      });
    } else {
      isNewVisitor = true;
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

    // 3. Update Global Stats (public routes only — admin/auth browsing shouldn't count)
    if (isPublicRoute(args.url)) {
      await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
        update: { totalViews: 1, totalUniqueViews: isNewVisitor ? 1 : 0 },
      });
    }
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
    const days = Math.min(args.days || 30, 90);
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const startTime = now - days * DAY_MS;
    const prevStartTime = startTime - days * DAY_MS;

    // Zero-fill the requested window so days without traffic still render.
    const dateKeys: string[] = [];
    const stats: Record<string, { date: string; visits: number; uniqueVisitors: number }> = {};
    for (let i = 0; i < days; i++) {
      const key = new Date(now - (days - 1 - i) * DAY_MS)
        .toISOString()
        .split("T")[0];
      dateKeys.push(key);
      stats[key] = { date: key, visits: 0, uniqueVisitors: 0 };
    }

    // Prefer the pre-aggregated dailyStats rows (a handful per window instead
    // of scanning up to 5000 raw pageVisits per request).
    const dailyRows = await ctx.db
      .query("dailyStats")
      .withIndex("by_date", (q) =>
        q.gte("date", dateKeys[0]).lte("date", dateKeys[dateKeys.length - 1]),
      )
      .take(500);

    let currentCount = 0;
    let prevCount = 0;

    if (dailyRows.length > 0) {
      for (const row of dailyRows) {
        if (stats[row.date]) {
          stats[row.date].visits = row.visits;
          stats[row.date].uniqueVisitors = row.uniqueVisitors;
        }
        currentCount += row.visits;
      }

      // Trend vs the previous window of equal length.
      const prevStartKey = new Date(prevStartTime)
        .toISOString()
        .split("T")[0];
      const prevRows = await ctx.db
        .query("dailyStats")
        .withIndex("by_date", (q) =>
          q.gte("date", prevStartKey).lt("date", dateKeys[0]),
        )
        .take(500);
      prevCount = prevRows.reduce((sum, row) => sum + row.visits, 0);
    } else {
      // Cold start: bounded raw fallback until the first daily rollup runs.
      const visits = await ctx.db
        .query("pageVisits")
        .withIndex("by_timestamp", (q) => q.gt("timestamp", startTime))
        .take(100);
      for (const visit of visits) {
        const key = new Date(visit.timestamp).toISOString().split("T")[0];
        if (stats[key]) stats[key].visits++;
      }
      currentCount = visits.length;
    }

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
      .take(5000); // Safety cap for bandwidth

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
    const visits = await ctx.db.query("pageVisits").take(5000);
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
    const visits = await ctx.db.query("pageVisits").take(5000);
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
      .take(200);

    const stats = articles.map((a) => {
      const reactionsCount = a.reactionsCount || 0;

      const avgReadTime =
        a.actualReadingTime && a.uniqueViewCount > 0
          ? Math.round(a.actualReadingTime / a.uniqueViewCount)
          : 0;

      return {
        id: a._id,
        title: a.title,
        views: a.viewCount,
        uniqueViews: a.uniqueViewCount,
        reactions: reactionsCount,
        avgReadTime, // in seconds
        engagementRate:
          a.uniqueViewCount > 0
            ? (reactionsCount / a.uniqueViewCount) * 100
            : 0,
      };
    });

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

export const getRawVisits = query({
    args: {
        paginationOpts: paginationOptsValidator,
        search: v.optional(v.string()),
        type: v.optional(v.union(v.literal("all"), v.literal("visit"), v.literal("article"), v.literal("reaction"))),
        days: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const days = args.days || 30;
        const type = args.type || "all";
        const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

        if (type === "reaction") {
            const q = ctx.db.query("reactions").withIndex("by_createdAt", (q) => q.gt("createdAt", startTime)).order("desc");
            
            let result;
            try {
                result = await q.paginate(args.paginationOpts);
            } catch (error) {
                // If cursor is invalid (e.g. from a different query type), reset to first page
                if (args.paginationOpts.cursor) {
                    result = await q.paginate({ ...args.paginationOpts, cursor: null });
                } else {
                    throw error;
                }
            }

            const page = await Promise.all(result.page.map(async (r) => {
                const article = await ctx.db.get(r.articleId);
                const user = await ctx.db.get(r.userId);
                return {
                    _id: r._id,
                    timestamp: r.createdAt,
                    type: "reaction",
                    url: article?.title ? `Reaction: ${r.type} on "${article.title}"` : `Reaction: ${r.type}`,
                    visitorId: user?.email || "User " + r.userId.substring(0, 8),
                    ipAddress: "---",
                    geoLocation: { country: "N/A", city: "N/A" },
                    device: "user",
                    browser: "---",
                    os: "---"
                };
            }));

            // Filter by search if provided (manual for reactions)
            if (args.search) {
                const s = args.search.toLowerCase();
                const filteredPage = page.filter(p => p.url.toLowerCase().includes(s) || p.visitorId.toLowerCase().includes(s));
                return { ...result, page: filteredPage };
            }

            return { ...result, page };
        }

        // Default to pageVisits for visits, articles, and all
        const q = ctx.db.query("pageVisits").withIndex("by_timestamp", (q) => q.gt("timestamp", startTime)).order("desc");

        let result;
        try {
            result = await q.paginate(args.paginationOpts);
        } catch (error) {
            // Fallback for invalid cursors
            if (args.paginationOpts.cursor) {
                result = await q.paginate({ ...args.paginationOpts, cursor: null });
            } else {
                throw error;
            }
        }

        let page = result.page;

        if (type === "article") {
            page = page.filter(v => v.url.toLowerCase().includes("/article/"));
        }

        if (args.search) {
            const s = args.search.toLowerCase();
            page = page.filter(v => 
                v.url.toLowerCase().includes(s) || 
                v.visitorId.toLowerCase().includes(s) ||
                v.ipAddress.includes(s)
            );
        }

        return { ...result, page };
    },
});
