import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()), // Hashed password for email/password flow
    profileImage: v.optional(v.string()), // Cloudinary URL
    provider: v.string(), // google/email
    role: v.union(v.literal("admin"), v.literal("user")),
    emailVerified: v.optional(v.boolean()),
    newsletterSubscribed: v.boolean(),
    createdAt: v.float64(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  articles: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(), // rich text/markdown
    coverImage: v.string(), // Cloudinary URL
    authorId: v.id("users"),
    categoryId: v.id("categories"),
    tags: v.array(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published"),
    ),
    source: v.union(v.literal("human"), v.literal("ai")),
    scheduledFor: v.optional(v.float64()),
    publishedAt: v.optional(v.float64()),
    viewCount: v.number(),
    uniqueViewCount: v.number(),
    readingTime: v.number(), // in minutes
    createdAt: v.float64(),
    updatedAt: v.float64(),
    isFeatured: v.optional(v.boolean()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_publishedAt", ["publishedAt"])
    .index("by_categoryId", ["categoryId"])
    .index("by_authorId", ["authorId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()), // Cloudinary URL
    articleCount: v.number(),
    createdAt: v.float64(),
  }).index("by_slug", ["slug"]),

  comments: defineTable({
    articleId: v.id("articles"),
    userId: v.id("users"),
    parentId: v.optional(v.id("comments")), // For nested replies
    content: v.string(),
    status: v.union(
      v.literal("approved"),
      v.literal("pending"),
      v.literal("spam"),
    ),
    createdAt: v.float64(),
  })
    .index("by_articleId", ["articleId"])
    .index("by_userId", ["userId"])
    .index("by_parentId", ["parentId"]),

  reactions: defineTable({
    articleId: v.id("articles"),
    userId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("insightful"),
    ),
    createdAt: v.float64(),
  }).index("by_article_user", ["articleId", "userId"]),

  bookmarks: defineTable({
    articleId: v.id("articles"),
    userId: v.id("users"),
    createdAt: v.float64(),
  }).index("by_user_article", ["userId", "articleId"]),

  pageVisits: defineTable({
    visitorId: v.string(), // tracking code
    userId: v.optional(v.id("users")),
    url: v.string(),
    ipAddress: v.string(),
    geoLocation: v.optional(
      v.object({
        country: v.optional(v.string()),
        city: v.optional(v.string()),
      }),
    ),
    device: v.string(), // mobile/tablet/desktop
    browser: v.string(),
    os: v.string(),
    referrer: v.optional(v.string()),
    timestamp: v.float64(),
  })
    .index("by_visitorId", ["visitorId"])
    .index("by_userId", ["userId"])
    .index("by_url", ["url"])
    .index("by_timestamp", ["timestamp"]),

  visitorTracking: defineTable({
    trackingCode: v.string(),
    userId: v.optional(v.id("users")),
    firstVisit: v.float64(),
    lastVisit: v.float64(),
    totalVisits: v.number(),
  })
    .index("by_trackingCode", ["trackingCode"])
    .index("by_userId", ["userId"]),

  aiSchedule: defineTable({
    dayOfWeek: v.number(), // 0-6
    time: v.string(), // HH:MM
    isActive: v.boolean(),
    lastRun: v.optional(v.float64()),
    topicsToResearch: v.array(v.string()),
  }),

  aiSettings: defineTable({
    provider: v.union(v.literal("chatgpt"), v.literal("gemini")),
    apiKey: v.string(), // encrypted
    model: v.string(),
    isActive: v.boolean(),
    lastTested: v.optional(v.float64()),
    testStatus: v.optional(v.union(v.literal("success"), v.literal("failed"))),
  }),

  articleViews: defineTable({
    articleId: v.id("articles"),
    visitorId: v.string(),
    userId: v.optional(v.id("users")),
    viewedAt: v.float64(),
  }).index("by_article_visitor", ["articleId", "visitorId"]),

  emailQueue: defineTable({
    recipientEmail: v.string(),
    type: v.union(
      v.literal("welcome"),
      v.literal("newsletter"),
      v.literal("comment"),
    ),
    subject: v.string(),
    body: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
    ),
    scheduledFor: v.float64(),
    sentAt: v.optional(v.float64()),
  }),
});
