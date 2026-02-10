import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    return category;
  },
});

export const getById = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return await Promise.all(
      categories.map(async (cat) => {
        const articles = await ctx.db
          .query("articles")
          .withIndex("by_categoryId", (q) => q.eq("categoryId", cat._id))
          .filter((q) => q.eq(q.field("status"), "published"))
          .collect();
        return {
          ...cat,
          articleCount: articles.length,
        };
      }),
    );
  },
});
