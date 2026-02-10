import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"));

    if (args.categoryId) {
      query = ctx.db
        .query("articles")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!))
        .filter((q) => q.eq(q.field("status"), "published"));
    }

    const articles = await query.order("desc").take(args.limit || 100);

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const category = await ctx.db.get(article.categoryId);
        return {
          ...article,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category?.name || "Uncategorized",
        };
      }),
    );
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
      authorName: author?.name || "Unknown Author",
      authorImage: author?.profileImage,
      categoryName: category?.name || "Uncategorized",
      categorySlug: category?.slug,
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

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const category = await ctx.db.get(article.categoryId);
        return {
          ...article,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category?.name || "Uncategorized",
        };
      }),
    );
  },
});

export const getByCategory = query({
  args: { categorySlug: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug))
      .unique();

    if (!category) return [];

    const articles = await ctx.db
      .query("articles")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", category._id))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(args.limit || 100);

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        return {
          ...article,
          authorName: author?.name || "Unknown Author",
          categoryName: category.name,
        };
      }),
    );
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query) return [];

    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) =>
        q.or(
          q.gt(q.field("title"), args.query), // Simple partial match hack for Convex or use search index
          q.gt(q.field("excerpt"), args.query),
        ),
      )
      .take(10);

    // Note: For real production, use Convex Search Indexes for better results
    return articles;
  },
});
