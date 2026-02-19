import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get current ad settings.
 */
export const getAdsSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("adsSettings").first();
    if (!settings) {
      return {
        adsEnabled: false,
        adsenseScriptCode: "",
        adsenseAdUnitCode: "",
        showAdTopOfArticle: false,
        showAdMiddleOfArticle: false,
        showAdBottomOfArticle: false,
        showAdSidebar: false,
        updatedAt: Date.now(),
      };
    }
    return settings;
  },
});

/**
 * Update ad settings. Only accessible by admins.
 */
export const updateAdsSettings = mutation({
  args: {
    adsEnabled: v.boolean(),
    adsenseScriptCode: v.string(),
    adsenseAdUnitCode: v.string(),
    showAdTopOfArticle: v.boolean(),
    showAdMiddleOfArticle: v.boolean(),
    showAdBottomOfArticle: v.boolean(),
    showAdSidebar: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can update ad settings");
    }

    const existing = await ctx.db.query("adsSettings").first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("adsSettings", {
        ...args,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
