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
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.1);">
      <div style="background: #09090b; padding: 80px 40px; text-align: center; position: relative;">
        <img src="{{siteUrl}}/illustrations/Welcome.svg" alt="Welcome Illustration" style="width: 240px; height: auto; margin-bottom: 40px; opacity: 1; display: block; margin-left: auto; margin-right: auto;" />
        <h1 style="color: white; margin: 0; font-family: 'Georgia', serif; font-size: 36px; letter-spacing: -0.03em; line-height: 1.2;">Welcome to the <span style="color: #2563eb;">Inner Circle</span>.</h1>
        <p style="color: #a1a1aa; font-size: 14px; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.3em; font-weight: 900;">Initiation Protocol Complete</p>
      </div>
      <div style="padding: 60px 50px; color: #09090b; line-height: 1.8;">
        <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 24px;">Reality starts here, {{name}}.</h2>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
          You've just taken the first step toward unfiltered reality. <strong>The Truth Pill</strong> is not just a publication; it&apos;s a recalibration of the human experience.
        </p>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 48px;">
          Expect insights that stir the mind and research that challenges the comfortable lies of modern existence.
        </p>
        <div style="text-align: center; margin-bottom: 60px;">
          <a href="{{siteUrl}}" style="background: #2563eb; color: white; padding: 22px 44px; border-radius: 20px; text-decoration: none; font-weight: 900; font-size: 15px; text-transform: uppercase; letter-spacing: 0.15em; display: inline-block; box-shadow: 0 20px 30px -10px rgba(37, 99, 235, 0.4);">Access Your Dashboard</a>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 40px;">
          <p style="font-size: 14px; color: #94a3b8; margin: 0;">In pursuit of truth,</p>
          <p style="font-size: 16px; font-weight: 900; color: #09090b; margin: 8px 0 0 0;">The Truth Pill Editorial</p>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 48px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 20px 0;">&copy; 2026 The Truth Pill. Evolution is mandatory.</p>
        <div style="display: inline-block;">
          <a href="{{unsubscribeUrl}}" style="color: #2563eb; text-decoration: none; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #dbeafe;">Silence these signals</a>
        </div>
      </div>
    </div>
  `,
  newsletter: `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.08);">
      <div style="background: #09090b; padding: 48px; text-align: center; position: relative;">
        <img src="{{siteUrl}}/illustrations/Newsletter.svg" alt="Newsletter Illustration" style="width: 180px; height: auto; margin-bottom: 32px; opacity: 1;" />
        <h1 style="color: white; margin: 0; font-family: 'Georgia', serif; font-size: 28px;">Weekly Transmission</h1>
        <p style="color: #2563eb; font-size: 12px; margin-top: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em;">The Observational Pulse</p>
      </div>
      <div style="padding: 50px;">
        <div style="background: #f8fafc; border-radius: 28px; padding: 40px; margin-bottom: 48px; border: 2px solid #eff6ff; position: relative;">
          <p style="margin: 0; font-family: 'Georgia', serif; font-style: italic; color: #0f172a; font-size: 20px; line-height: 1.7; position: relative; z-index: 10;">"{{quoteText}}"</p>
          <p style="margin: 24px 0 0 0; color: #2563eb; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">— {{quoteAuthor}}</p>
        </div>
        
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 12px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">Top Intelligence Nodes</h3>
          {{articlesHtml}}
        </div>
        
        <div style="text-align: center; margin-top: 60px;">
          <a href="{{siteUrl}}" style="background: #09090b; color: white; padding: 20px 48px; border-radius: 18px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.15em; display: inline-block;">Return to Source</a>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 40px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="font-size: 11px; color: #94a3b8; margin-bottom: 12px;">&copy; 2026 The Truth Pill. Deciphering the Human Experience.</p>
        <a href="{{unsubscribeUrl}}" style="color: #64748b; text-decoration: none; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">Unsubscribe</a>
      </div>
    </div>
  `,
  confirm_subscription: `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.05);">
      <div style="padding: 80px 50px; text-align: center;">
        <img src="{{siteUrl}}/illustrations/Messaging.svg" alt="Confirm Illustration" style="width: 200px; height: auto; margin-bottom: 48px; opacity: 1;" />
        <h1 style="font-size: 32px; font-weight: 900; color: #09090b; margin-bottom: 16px; letter-spacing: -0.02em;">Verify Connection</h1>
        <p style="color: #64748b; font-size: 17px; line-height: 1.7; margin-bottom: 40px; max-width: 400px; margin-left: auto; margin-right: auto;">
          You&apos;re one step away from joining <strong>The Truth Pill</strong>. Please confirm your subscription to activate our intelligence stream.
        </p>
        <a href="{{confirmUrl}}" style="background: #2563eb; color: white; padding: 20px 48px; border-radius: 18px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.2em; display: inline-block; shadow: 0 10px 20px rgba(37, 99, 235, 0.3);">Confirm Subscription</a>
        <p style="margin-top: 48px; font-size: 13px; color: #94a3b8;">If you did not initiate this protocol, please ignore this transmission.</p>
      </div>
    </div>
  `,
  reset_password: `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 32px; overflow: hidden;">
      <div style="padding: 80px 50px; text-align: center;">
        <img src="{{siteUrl}}/illustrations/Secure-login.svg" alt="Reset Illustration" style="width: 200px; height: auto; margin-bottom: 48px; opacity: 1;" />
        <h1 style="font-size: 32px; font-weight: 900; color: #09090b; margin-bottom: 16px; letter-spacing: -0.02em;">Identity Reset</h1>
        <p style="color: #64748b; font-size: 17px; line-height: 1.7; margin-bottom: 40px; max-width: 400px; margin-left: auto; margin-right: auto;">
          An identity reset for <strong>The Truth Pill</strong> was requested. This secure link will remain active for 60 minutes.
        </p>
        <a href="{{resetUrl}}" style="background: #09090b; color: white; padding: 20px 48px; border-radius: 18px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.2em; display: inline-block;">Reset Password</a>
        <p style="margin-top: 48px; font-size: 13px; color: #94a3b8;">If you did not authorize this recalibration, secure your account immediately.</p>
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
