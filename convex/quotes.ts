import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const add = mutation({
  args: {
    text: v.string(),
    author: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quotes", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("quotes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getRandom = query({
  handler: async (ctx) => {
    const quotes = await ctx.db.query("quotes").collect();
    if (quotes.length === 0) return null;
    return quotes[Math.floor(Math.random() * quotes.length)];
  },
});

export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("quotes").order("desc").collect();
  },
});
