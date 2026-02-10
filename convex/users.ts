import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(), // Already hashed from server action
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("User already exists");
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: args.password,
      provider: "email",
      role: "user",
      newsletterSubscribed: false,
      createdAt: Date.now(),
    });
  },
});

export const store = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    profileImage: v.optional(v.string()),
    provider: v.string(),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    let userId;
    if (existingUser) {
      userId = existingUser._id;
      // Update profile image if it changed
      if (
        args.profileImage &&
        existingUser.profileImage !== args.profileImage
      ) {
        await ctx.db.patch(userId, { profileImage: args.profileImage });
      }
    } else {
      userId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        profileImage: args.profileImage,
        provider: args.provider,
        role: "user",
        newsletterSubscribed: false,
        createdAt: Date.now(),
      });
    }

    // Link visitor tracking if provided
    if (args.visitorId) {
      const tracking = await ctx.db
        .query("visitorTracking")
        .withIndex("by_trackingCode", (q) =>
          q.eq("trackingCode", args.visitorId!),
        )
        .unique();

      if (tracking) {
        await ctx.db.patch(tracking._id, { userId });

        // Backfill previous page visits
        const visits = await ctx.db
          .query("pageVisits")
          .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId!))
          .collect();

        for (const visit of visits) {
          if (!visit.userId) {
            await ctx.db.patch(visit._id, { userId });
          }
        }
      }
    }

    return userId;
  },
});

export const currentUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});
