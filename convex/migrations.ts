import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Backfills isArchived: false for all articles where it's missing.
 * This is necessary for the search index filter to work correctly.
 */
export const backfillIsArchived = mutation({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db.query("articles").collect();
    let count = 0;
    for (const article of articles) {
      if (article.isArchived === undefined) {
        await ctx.db.patch(article._id, { isArchived: false });
        count++;
      }
    }
    return { updated: count, total: articles.length };
  },
});
