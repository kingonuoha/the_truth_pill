import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateOtp = mutation({
  args: {
    email: v.string(),
    type: v.union(v.literal("password_reset"), v.literal("password_change")),
  },
  handler: async (ctx, args) => {
    // 1. Check if user exists (internal query)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    // "The reset password should'nt send emails to non users, but shouldn't also tell the user that the email provided is a none user"
    if (!user) {
      return {
        success: true,
        message: "If you have an account with us, you should get an email",
      };
    }

    // 2. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 3. Delete any existing OTPs for this email and type
    const existingOtps = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) =>
        q.eq("email", args.email).eq("type", args.type),
      )
      .collect();

    for (const otp of existingOtps) {
      await ctx.db.delete(otp._id);
    }

    // 4. Save new OTP
    await ctx.db.insert("otpCodes", {
      email: args.email,
      code,
      type: args.type,
      expiresAt,
    });

    // 5. Queue Email
    await ctx.db.insert("emailQueue", {
      recipient: args.email,
      subject:
        args.type === "password_reset"
          ? "Reset Your Password - The Truth Pill"
          : "Verify Password Change - The Truth Pill",
      templateName: "otp_verification",
      templateData: {
        otpCode: code,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.org",
      },
      status: "pending",
      scheduledFor: Date.now(),
      retries: 0,
    });

    return {
      success: true,
      message: "If you have an account with us, you should get an email",
    };
  },
});

export const verifyOtp = query({
  args: {
    email: v.string(),
    code: v.string(),
    type: v.union(v.literal("password_reset"), v.literal("password_change")),
  },
  handler: async (ctx, args) => {
    const otp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) =>
        q.eq("email", args.email).eq("type", args.type),
      )
      .filter((q) => q.eq(q.field("code"), args.code))
      .unique();

    if (!otp) return { success: false, message: "Invalid code" };
    if (otp.expiresAt < Date.now())
      return { success: false, message: "Code expired" };

    return { success: true, message: "Code verified" };
  },
});

export const verifyOtpAndChangePassword = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    type: v.union(v.literal("password_reset"), v.literal("password_change")),
    newPassword: v.string(), // Already hashed
  },
  handler: async (ctx, args) => {
    const otp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) =>
        q.eq("email", args.email).eq("type", args.type),
      )
      .filter((q) => q.eq(q.field("code"), args.code))
      .unique();

    if (!otp) return { success: false, message: "Invalid code" };
    if (otp.expiresAt < Date.now())
      return { success: false, message: "Code expired" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return { success: false, message: "Account not found" };

    // Update password
    await ctx.db.patch(user._id, {
      password: args.newPassword,
      resetToken: undefined, // Cleanup old methods if any
      resetTokenExpires: undefined,
    });

    // Delete OTP
    await ctx.db.delete(otp._id);

    return { success: true, message: "Password updated successfully" };
  },
});
