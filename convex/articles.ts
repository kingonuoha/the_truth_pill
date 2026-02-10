import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc");

    if (args.limit) {
      return await q.take(args.limit);
    }
    return await q.collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("articles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!article) return null;

    const author = await ctx.db.get(article.authorId);
    const category = await ctx.db.get(article.categoryId);

    return {
      ...article,
      author: author?.name || "Unknown Author",
      authorImage: author?.profileImage,
      categoryName: category?.name || "Uncategorized",
    };
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.eq(q.field("isFeatured"), true))
      .order("desc")
      .take(args.limit || 5);

    return articles;
  },
});
