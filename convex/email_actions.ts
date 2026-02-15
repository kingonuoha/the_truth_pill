"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || "587");
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error("Missing email configuration environment variables");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    pool: true, // Use pooling for better performance
  });
};

const templates: Record<string, string> = {
  welcome: `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">The Truth Pill</h1>
      </div>
      <div style="padding: 40px 30px; line-height: 1.8; color: #1e293b;">
        <h2 style="color: #0ea5e9;">Welcome to the Journey, {{name}}!</h2>
        <p>We're thrilled to have you here. <strong>The Truth Pill</strong> exists to help people live a full life and become a better human to themselves and everyone around them.</p>
        <p>In your inbox, you'll receive weekly insights and psychology-focused articles that challenge your perspective and help you grow.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{siteUrl}}" style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Start Exploring</a>
        </div>
        <p style="font-style: italic; color: #64748b;">— Admin  & The Truth Pill Team</p>
      </div>
      <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p>&copy; 2026 The Truth Pill. All rights reserved.</p>
        <p><a href="{{unsubscribeUrl}}" style="color: #a855f7; text-decoration: underline;">Unsubscribe</a></p>
      </div>
    </div>
  `,
  newsletter: `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your Weekly Truth Pill</h1>
      </div>
      <div style="padding: 30px; line-height: 1.8; color: #1e293b;">
        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
          <p style="margin: 0; font-style: italic; color: #1e293b; font-size: 16px;">"{{quoteText}}"</p>
          <p style="margin: 10px 0 0 0; color: #64748b; font-size: 13px; font-weight: bold;">— {{quoteAuthor}}</p>
        </div>
        
        <p>Hello {{name}}, here are this week&apos;s most insightful articles:</p>
        
        {{articlesHtml}}
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{siteUrl}}" style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Visit Dashboard</a>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p>&copy; 2026 The Truth Pill. All rights reserved.</p>
        <p><a href="{{unsubscribeUrl}}" style="color: #a855f7; text-decoration: underline;">Unsubscribe</a></p>
      </div>
    </div>
  `,
  comment_alert: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: #0ea5e9; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">New Comment Notification</h2>
      </div>
      <div style="padding: 20px; line-height: 1.6; color: #1e293b;">
        <p><strong>{{commenterName}}</strong> left a new comment on <strong>"{{articleTitle}}"</strong>:</p>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #a855f7;">
          "{{commentContent}}"
        </div>
        <div style="margin-top: 25px;">
          <a href="{{adminUrl}}" style="background: #a855f7; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Moderate Comment</a>
        </div>
      </div>
    </div>
  `,
  new_article: `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Insight Published</h1>
      </div>
      <div style="padding: 30px; line-height: 1.8; color: #1e293b;">
        <h2 style="color: #1e293b; margin-top: 0;">{{articleTitle}}</h2>
        <p>{{excerpt}}</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="{{articleUrl}}" style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Read Full Article</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">Published by {{authorName}} in {{categoryName}}</p>
      </div>
      <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p>&copy; 2026 The Truth Pill. All rights reserved.</p>
        <p><a href="{{unsubscribeUrl}}" style="color: #a855f7; text-decoration: underline;">Unsubscribe</a></p>
      </div>
    </div>
  `,
  confirm_subscription: `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Confirm Your Subscription</h1>
      </div>
      <div style="padding: 40px 30px; line-height: 1.8; color: #1e293b;">
        <h2 style="color: #0ea5e9;">Just one more step!</h2>
        <p>Please click the button below to confirm your subscription to <strong>The Truth Pill</strong> newsletter. This ensures that we have the right email address and that you actually want to hear from us.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{confirmUrl}}" style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Confirm Subscription</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `,
  reset_password: `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
      </div>
      <div style="padding: 40px 30px; line-height: 1.8; color: #1e293b;">
        <h2 style="color: #0ea5e9;">Password Reset Request</h2>
        <p>We received a request to reset your password for <strong>The Truth Pill</strong>. Click the button below to set a new password. This link will expire in 1 hour.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{resetUrl}}" style="background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
    </div>
  `,
};

const renderTemplate = (name: string, data: Record<string, string>) => {
  let html = templates[name] || templates["welcome"];
  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return html;
};

export const processQueue = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const pendingEmails = await ctx.runQuery(internal.emails.getPendingEmails, {
      limit,
    });

    if (pendingEmails.length === 0) return;

    const transporter = getTransporter();

    for (const email of pendingEmails) {
      try {
        // Mark as sending
        await ctx.runMutation(internal.emails.updateEmailStatus, {
          id: email._id,
          status: "sending",
        });

        const html = renderTemplate(email.templateName, email.templateData);

        await transporter.sendMail({
          from: `"The Truth Pill" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
          to: email.recipient,
          subject: email.subject,
          html,
        });

        // Mark as sent
        await ctx.runMutation(internal.emails.updateEmailStatus, {
          id: email._id,
          status: "sent",
          sentAt: Date.now(),
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Failed to send email to ${email.recipient}:`,
          errorMessage,
        );

        const shouldRetry = email.retries < 3;
        await ctx.runMutation(internal.emails.updateEmailStatus, {
          id: email._id,
          status: shouldRetry ? "pending" : "failed",
          error: errorMessage,
          retryIncrement: true,
        });
      }
    }
  },
});

export const sendTestEmail = action({
  args: {
    recipient: v.string(),
  },
  handler: async (ctx, args) => {
    const transporter = getTransporter();

    try {
      await transporter.sendMail({
        from: `"The Truth Pill" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: args.recipient,
        subject: "The Truth Pill - Test Email",
        html: `
          <div style="padding: 20px; font-family: sans-serif; text-align: center;">
            <h1 style="color: #0ea5e9;">Test Successful!</h1>
            <p>If you're reading this, your SMTP configuration for <strong>The Truth Pill</strong> is working correctly.</p>
            <div style="margin: 20px; padding: 10px; background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); color: white; display: inline-block; border-radius: 8px;">
              Email System Online
            </div>
          </div>
        `,
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Test email failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },
});

export const requestPasswordReset = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expires = Date.now() + 3600000; // 1 hour

    const userId = await ctx.runMutation(internal.users.setResetToken, {
      email: args.email,
      token,
      expires,
    });

    if (!userId) return { success: true }; // Don't leak existence

    const transporter = getTransporter();
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.com"}/auth/reset-password?token=${token}`;

    const html = renderTemplate("reset_password", { resetUrl });

    try {
      await transporter.sendMail({
        from: `"The Truth Pill" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: args.email,
        subject: "Reset your password - The Truth Pill",
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to send reset email:", error);
      return { success: false, error: "Failed to send email" };
    }
  },
});
