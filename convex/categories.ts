import { query, mutation } from "./_generated/server";
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
    const categories = await ctx.db.query("categories").take(200);
    return await Promise.all(
      categories.map(async (category) => {
        const pillars = await ctx.db
          .query("pillars")
          .withIndex("by_categoryId", (q) => q.eq("categoryId", category._id))
          .take(50);

        return {
          _id: category._id,
          _creationTime: category._creationTime,
          name: category.name,
          slug: category.slug,
          description: category.description,
          coverImage: category.coverImage,
          articleCount: category.articleCount ?? 0,
          pillarCount: pillars.length,
          createdAt: category.createdAt,
        };
      }),
    );
  },
});
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    pexelsImages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", {
      ...args,
      articleCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    pexelsImages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...args }) => {
    await ctx.db.patch(id, args);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    // Delete guard: cannot delete if articles are linked
    const linked = await ctx.db
      .query("articles")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .take(1);
    if (linked.length > 0) {
      throw new Error(
        "Cannot delete this category — it has articles linked to it. Remove or reassign those articles first.",
      );
    }
    await ctx.db.delete(args.id);
  },
});
