import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pillars")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .order("asc")
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const pillars = await ctx.db.query("pillars").order("asc").take(200);
    return await Promise.all(
      pillars.map(async (pillar) => {
        const category = await ctx.db.get(pillar.categoryId);
        return {
          ...pillar,
          categoryName: category?.name || "Uncategorized",
          categorySlug: category?.slug || "",
        };
      }),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pillars")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    categoryId: v.id("categories"),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    pexelsImages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check for duplicate slug
    const existing = await ctx.db
      .query("pillars")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`A pillar with slug "${args.slug}" already exists.`);

    return await ctx.db.insert("pillars", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      categoryId: args.categoryId,
      coverImage: args.coverImage,
      pexelsImages: args.pexelsImages,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("pillars"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    coverImage: v.optional(v.string()),
    pexelsImages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...args }) => {
    await ctx.db.patch(id, args);
  },
});

export const remove = mutation({
  args: { id: v.id("pillars") },
  handler: async (ctx, args) => {
    const pillar = await ctx.db.get(args.id);
    if (!pillar) throw new Error("Pillar not found");

    // Delete guard: check if any articles use this pillar slug
    const linkedArticles = await ctx.db
      .query("articles")
      .filter((q) => q.eq(q.field("pillar"), pillar.slug))
      .take(1);

    if (linkedArticles.length > 0) {
      throw new Error(
        `Cannot delete pillar "${pillar.name}" — it has articles linked to it. Remove or reassign those articles first.`,
      );
    }

    await ctx.db.delete(args.id);
  },
});
