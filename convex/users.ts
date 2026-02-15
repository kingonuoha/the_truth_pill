import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(), // Already hashed from server action
    newsletterSubscribed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("User already exists");
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: args.password,
      provider: "email",
      role: "user",
      newsletterSubscribed: args.newsletterSubscribed ?? false,
      createdAt: Date.now(),
    });

    // Queue Welcome Email
    await ctx.db.insert("emailQueue", {
      recipient: args.email,
      subject: "Welcome to The Truth Pill! 🎯",
      templateName: "welcome",
      templateData: {
        name: args.name,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.com",
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.com"}/unsubscribe?email=${encodeURIComponent(args.email)}`,
      },
      status: "pending",
      scheduledFor: Date.now(),
      retries: 0,
    });

    return userId;
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

      // Queue Welcome Email for New OAuth User
      await ctx.db.insert("emailQueue", {
        recipient: args.email,
        subject: "Welcome to The Truth Pill! 🎯",
        templateName: "welcome",
        templateData: {
          name: args.name,
          siteUrl:
            process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.com",
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.com"}/unsubscribe?email=${encodeURIComponent(args.email)}`,
        },
        status: "pending",
        scheduledFor: Date.now(),
        retries: 0,
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

export const getMe = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();
  },
});

export const subscribeToNewsletter = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    const token = Math.random().toString(36).substring(2, 15);

    if (user) {
      if (user.emailConfirmed) {
        await ctx.db.patch(user._id, { newsletterSubscribed: true });
        return { status: "subscribed" };
      } else {
        // Already registered but not confirmed, resend confirmation
        await ctx.db.patch(user._id, { confirmationToken: token });
      }
    } else {
      // Create a pending guest user
      await ctx.db.insert("users", {
        name: "Guest",
        email: args.email,
        provider: "guest",
        role: "user",
        newsletterSubscribed: false,
        emailConfirmed: false,
        confirmationToken: token,
        createdAt: Date.now(),
      });
    }

    // Queue Confirmation Email
    await ctx.db.insert("emailQueue", {
      recipient: args.email,
      subject: "Action Required: Confirm your subscription to The Truth Pill",
      templateName: "confirm_subscription",
      templateData: {
        confirmUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.com"}/confirm-subscription?token=${token}`,
      },
      status: "pending",
      scheduledFor: Date.now(),
      retries: 0,
    });

    return { status: "verification_sent" };
  },
});

export const confirmNewsletter = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_confirmationToken", (q) =>
        q.eq("confirmationToken", args.token),
      )
      .unique();

    if (!user) return { success: false, message: "Invalid or expired token" };

    await ctx.db.patch(user._id, {
      newsletterSubscribed: true,
      emailConfirmed: true,
      confirmationToken: undefined, // Clear the token
    });

    return { success: true };
  },
});
export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    newsletterSubscribed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      ...args,
    });
  },
});

export const getMeFull = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) return null;

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_article", (q) => q.eq("userId", user._id))
      .collect();

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return {
      ...user,
      stats: {
        bookmarks: bookmarks.length,
        comments: comments.length,
        reactions: reactions.length,
      },
    };
  },
});

export const deleteAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) throw new Error("User not found");

    // Clean up related data (optional but good practice)
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_article", (q) => q.eq("userId", user._id))
      .collect();
    for (const b of bookmarks) await ctx.db.delete(b._id);

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);

    await ctx.db.delete(user._id);
  },
});

export const unsubscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return { success: false, message: "User not found" };

    await ctx.db.patch(user._id, { newsletterSubscribed: false });
    return { success: true };
  },
});
export const setResetToken = internalMutation({
  args: { email: v.string(), token: v.string(), expires: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!user) return null;
    await ctx.db.patch(user._id, {
      resetToken: args.token,
      resetTokenExpires: args.expires,
    });
    return user._id;
  },
});

export const resetPassword = mutation({
  args: { token: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_resetToken", (q) => q.eq("resetToken", args.token))
      .unique();

    if (
      !user ||
      !user.resetTokenExpires ||
      user.resetTokenExpires < Date.now()
    ) {
      return { success: false, message: "Invalid or expired reset token." };
    }

    await ctx.db.patch(user._id, {
      password: args.password, // Already hashed from server action
      resetToken: undefined,
      resetTokenExpires: undefined,
    });

    return { success: true };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    // Check admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (user?.role !== "admin") return [];

    return await ctx.db.query("users").order("desc").collect();
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    // Check admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (user?.role !== "admin") throw new Error("Forbidden");

    await ctx.db.patch(args.id, { role: args.role });
  },
});
