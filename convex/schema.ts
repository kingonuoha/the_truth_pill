import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  globalStats: defineTable({
    articleCount: v.number(),
    publishedArticleCount: v.number(),
    draftArticleCount: v.number(),
    scheduledArticleCount: v.number(),
    aiDraftCount: v.number(),
    usersCount: v.number(),
    commentsCount: v.number(),
    pendingCommentsCount: v.number(),
    totalViews: v.number(),
    totalUniqueViews: v.number(),
  }),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()), // Hashed password for email/password flow
    profileImage: v.optional(v.string()), // Cloudinary URL
    provider: v.string(), // google/email
    role: v.union(v.literal("admin"), v.literal("user")),
    emailVerified: v.optional(v.boolean()),
    newsletterSubscribed: v.boolean(),
    emailConfirmed: v.optional(v.boolean()),
    confirmationToken: v.optional(v.string()),
    resetToken: v.optional(v.string()),
    resetTokenExpires: v.optional(v.float64()),
    completedTours: v.optional(v.array(v.string())),
    createdAt: v.float64(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_confirmationToken", ["confirmationToken"])
    .index("by_resetToken", ["resetToken"]),

  quotes: defineTable({
    text: v.string(),
    author: v.string(),
    category: v.optional(v.string()),
    createdAt: v.float64(),
  }).index("by_createdAt", ["createdAt"]),

  articles: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()), // rich text/markdown
    coverImage: v.optional(v.string()), // Cloudinary URL
    coverImageAlt: v.optional(v.string()),
    authorId: v.id("users"),
    categoryId: v.optional(v.id("categories")),
    pillar: v.optional(v.string()), // Pillar slug e.g. "self-sabotage"
    topics: v.optional(v.array(v.string())), // Single topic (kept as array for back-compat, max 1)
    tags: v.optional(v.array(v.string())), // Cross-cutting tags (min 4 for publish)
    type: v.optional(
      v.union(
        v.literal("pillar"),
        v.literal("cluster"),
        v.literal("micro"),
        v.literal("insight"),
        v.literal("observant"),
      ),
    ),
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
    reactionsCount: v.optional(v.number()), // denormalized counter for getTopContent
    readingTime: v.number(), // estimated minutes
    actualReadingTime: v.optional(v.number()), // total seconds spent by all users
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
    isFeatured: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_publishedAt", ["publishedAt"])
    .index("by_categoryId", ["categoryId"])
    .index("by_authorId", ["authorId"])
    .index("by_status_category", ["status", "categoryId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "categoryId", "isArchived"],
    }),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()), // Cloudinary URL
    pexelsImages: v.optional(v.array(v.string())), // Array of Pexels image URLs (2-10)
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
      v.literal("removed"),
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
  })
    .index("by_articleId", ["articleId"])
    .index("by_userId", ["userId"])
    .index("by_article_user", ["articleId", "userId"])
    .index("by_createdAt", ["createdAt"]),

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

  dailyStats: defineTable({
    date: v.string(), // YYYY-MM-DD (UTC)
    visits: v.number(), // total page visits for the day
    uniqueVisitors: v.number(), // distinct visitorTracking codes for the day
    lastRollup: v.optional(v.float64()), // watermark: timestamp of the last pageVisit folded in
  }).index("by_date", ["date"]),

  aiSchedule: defineTable({
    daysOfWeek: v.array(v.number()), // [0-6]
    time: v.string(), // HH:MM
    timezone: v.string(), // e.g. "UTC", "Africa/Lagos"
    isActive: v.boolean(),
    lastRun: v.optional(v.float64()),
    topicsToResearch: v.array(v.string()),
    nextRun: v.optional(v.float64()),
  }),

  aiSettings: defineTable({
    provider: v.string(), // openai, anthropic, deepseek, etc.
    apiKey: v.string(), // encrypted
    model: v.string(),
    promptTemplate: v.optional(v.string()),
    isActive: v.boolean(),
    lastTested: v.optional(v.float64()),
    testStatus: v.optional(v.union(v.literal("success"), v.literal("failed"))),
    isWriting: v.optional(v.float64()),
    createdAt: v.optional(v.float64()),
  }),

  articleViews: defineTable({
    articleId: v.id("articles"),
    visitorId: v.string(),
    userId: v.optional(v.id("users")),
    viewedAt: v.float64(),
    engagementTime: v.optional(v.number()), // total seconds for this session
  }).index("by_article_visitor", ["articleId", "visitorId"]),

  emailQueue: defineTable({
    recipient: v.string(),
    subject: v.string(),
    templateName: v.string(),
    templateData: v.any(), // JSON template data
    status: v.union(
      v.literal("pending"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
    ),
    scheduledFor: v.float64(),
    sentAt: v.optional(v.float64()),
    error: v.optional(v.string()),
    retries: v.number(),
  }).index("by_status_scheduled", ["status", "scheduledFor"]),
  researchTopics: defineTable({
    topic: v.string(),
    categoryId: v.optional(v.id("categories")),
    status: v.union(v.literal("pending"), v.literal("processed")),
    createdAt: v.float64(),
  }).index("by_status", ["status"]),

  adsSettings: defineTable({
    adsEnabled: v.boolean(),
    adsenseScriptCode: v.string(),
    adsenseAdUnitCode: v.string(),
    showAdTopOfArticle: v.boolean(),
    showAdMiddleOfArticle: v.boolean(),
    showAdBottomOfArticle: v.boolean(),
    showAdSidebar: v.boolean(),
    updatedAt: v.float64(),
  }),

  siteSettings: defineTable({
    siteName: v.string(),
    siteDescription: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    socials: v.object({
      facebook: v.optional(v.string()),
      twitter: v.optional(v.string()),
      instagram: v.optional(v.string()),
      youtube: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      github: v.optional(v.string()),
    }),
    footerText: v.optional(v.string()),
    updatedAt: v.float64(),
  }),
  otpCodes: defineTable({
    email: v.string(),
    code: v.string(),
    type: v.union(v.literal("password_reset"), v.literal("password_change")),
    expiresAt: v.float64(),
  })
    .index("by_email", ["email"])
    .index("by_code", ["code"])
    .index("by_email_type", ["email", "type"]),

  pillars: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    pexelsImages: v.optional(v.array(v.string())),
    categoryId: v.id("categories"), // ties pillar to a category
    createdAt: v.float64(),
  })
    .index("by_slug", ["slug"])
    .index("by_categoryId", ["categoryId"]),
});
