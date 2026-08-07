import { internalMutation } from "./_generated/server";

/**
 * Purges page visits older than 90 days to conserve database space and ensure 
 * high-performance analytics queries.
 * 
 * Retention Period: 90 Days
 * Run Frequency: Daily via crons.ts
 */
export const purgeOldAnalytics = internalMutation({
  args: {},
  handler: async (ctx) => {
    const RETENTION_PERIOD_MS = 90 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - RETENTION_PERIOD_MS;

    // Fetch the oldest 500 records to purge in this batch
    // We use a batch size to stay within Convex execution time limits
    const oldVisits = await ctx.db
      .query("pageVisits")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .take(500);

    let deletedCount = 0;
    for (const visit of oldVisits) {
      await ctx.db.delete(visit._id);
      deletedCount++;
    }

    console.log(`Purged ${deletedCount} page visit records older than 90 days.`);
    
    return {
      deletedCount,
      isDone: oldVisits.length < 500,
    };
  },
});
