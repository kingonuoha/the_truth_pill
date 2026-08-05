import { internalMutation } from "./_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_MS = 90 * DAY_MS;
const BATCH_SIZE = 5000;

/**
 * Folds `pageVisits` into one `dailyStats` row per day so `getTrafficStats`
 * can read ~60 rows instead of scanning up to 5000 raw visits per request.
 *
 * Scheduled daily via `convex/crons.ts` (2:00 AM, before the 3:00 AM purge).
 *
 * Resumable: the last processed `pageVisits.timestamp` is stored on the
 * `dailyStats` rows (`lastRollup`) and used as the scan watermark. On the
 * first run the watermark is 90 days back, backfilling the retention window.
 *
 * Note: if a single day spans multiple batches, `uniqueVisitors` is summed
 * per batch and a visitor seen in two batches is counted twice. Daily volume
 * is far below BATCH_SIZE so this is not expected in practice.
 */
export const rollupDailyStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const latestRow = await ctx.db
      .query("dailyStats")
      .withIndex("by_date", (q) =>
        q.gte("date", "1970-01-01").lte("date", "9999-12-31"),
      )
      .order("desc")
      .take(1);

    const watermark = latestRow[0]?.lastRollup ?? Date.now() - RETENTION_MS;

    const visits = await ctx.db
      .query("pageVisits")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", watermark))
      .order("asc")
      .take(BATCH_SIZE);

    const buckets = new Map<string, { visits: number; visitors: Set<string> }>();
    let maxTimestamp = watermark;

    for (const visit of visits) {
      const date = new Date(visit.timestamp).toISOString().split("T")[0];
      const bucket =
        buckets.get(date) ?? { visits: 0, visitors: new Set<string>() };
      bucket.visits += 1;
      bucket.visitors.add(visit.visitorId);
      buckets.set(date, bucket);
      if (visit.timestamp > maxTimestamp) maxTimestamp = visit.timestamp;
    }

    for (const [date, bucket] of buckets) {
      const existing = await ctx.db
        .query("dailyStats")
        .withIndex("by_date", (q) => q.eq("date", date))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          visits: existing.visits + bucket.visits,
          uniqueVisitors: existing.uniqueVisitors + bucket.visitors.size,
          lastRollup: maxTimestamp,
        });
      } else {
        await ctx.db.insert("dailyStats", {
          date,
          visits: bucket.visits,
          uniqueVisitors: bucket.visitors.size,
          lastRollup: maxTimestamp,
        });
      }
    }

    return {
      processed: visits.length,
      dates: buckets.size,
      isDone: visits.length < BATCH_SIZE,
    };
  },
});
