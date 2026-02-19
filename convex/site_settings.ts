import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("siteSettings").first();
    if (!settings) {
      // Return minimal defaults if none exist yet
      return {
        siteName: "The Truth Pill",
        siteDescription:
          "Deciphering the human experience through deep psychological research and unfiltered insights.",
        email: "",
        phone: "",
        socials: {
          facebook: "",
          twitter: "",
          instagram: "",
          youtube: "",
          tiktok: "",
          linkedin: "",
          github: "",
        },
        footerText: "Unfiltered Evolution.",
      };
    }
    return settings;
  },
});

export const updateSiteSettings = mutation({
  args: {
    siteName: v.string(),
    siteDescription: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    socials: v.object({
      facebook: v.optional(v.string()),
      twitter: v.optional(v.string()),
      instagram: v.optional(v.string()),
      youtube: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      github: v.optional(v.string()),
    }),
    footerText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("siteSettings").first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("siteSettings", {
        ...args,
        updatedAt: now,
      });
    }
  },
});
