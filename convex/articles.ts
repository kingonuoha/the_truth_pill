import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let articleQuery = ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.eq(q.field("isArchived"), undefined));

    if (args.categoryId) {
      articleQuery = ctx.db
        .query("articles")
        .withIndex("by_categoryId", (q) =>
          q.eq("categoryId", args.categoryId as Id<"categories">),
        )
        .filter((q) => q.eq(q.field("status"), "published"));
    }

    let articles = await articleQuery.order("desc").take(args.limit || 100);

    if (args.tag) {
      articles = articles.filter((article) =>
        article.tags?.includes(args.tag!),
      );
    }

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const category = article.categoryId
          ? await ctx.db.get(article.categoryId)
          : null;
        return {
          ...article,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category?.name || "Uncategorized",
        };
      }),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("articles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!article) return null;

    const author = await ctx.db.get(article.authorId);
    const category = article.categoryId
      ? await ctx.db.get(article.categoryId)
      : null;

    return {
      ...article,
      authorName: author?.name || "Unknown Author",
      authorImage: author?.profileImage,
      categoryName: category?.name || "Uncategorized",
      categorySlug: category?.slug,
    };
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.eq(q.field("isFeatured"), true))
      .order("desc")
      .take(args.limit || 5);

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const category = article.categoryId
          ? await ctx.db.get(article.categoryId)
          : null;
        return {
          ...article,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category?.name || "Uncategorized",
        };
      }),
    );
  },
});

export const getByCategory = query({
  args: { categorySlug: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug))
      .unique();

    if (!category) return [];

    const articles = await ctx.db
      .query("articles")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", category._id))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(args.limit || 100);

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        return {
          ...article,
          authorName: author?.name || "Unknown Author",
          categoryName: category.name,
        };
      }),
    );
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query) return [];

    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) =>
        q.or(
          q.gt(q.field("title"), args.query), // Simple partial match hack for Convex or use search index
          q.gt(q.field("excerpt"), args.query),
        ),
      )
      .take(10);

    // Note: For real production, use Convex Search Indexes for better results
    return articles;
  },
});

export const getPopularTags = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(100);

    const tagCounts: Record<string, number> = {};
    articles.forEach((article) => {
      article.tags?.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, args.limit || 20)
      .map(([tag]) => tag);
  },
});
export const getById = query({
  args: { id: v.id("articles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (!article) return null;
    return article;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    tags: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published"),
    ),
    source: v.union(v.literal("human"), v.literal("ai")),
    scheduledFor: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validation for non-drafts
    if (args.status !== "draft") {
      if (!args.excerpt) throw new Error("Excerpt is required for publishing");
      if (!args.content) throw new Error("Content is required for publishing");
      if (!args.coverImage)
        throw new Error("Cover Image is required for publishing");
      if (!args.categoryId)
        throw new Error("Category is required for publishing");
      if (!args.tags || args.tags.length === 0)
        throw new Error("Tags are required for publishing");
    }
    // Get current user as author
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const articleId = await ctx.db.insert("articles", {
      ...args,
      authorId: user._id,
      viewCount: 0,
      uniqueViewCount: 0,
      readingTime: Math.ceil((args.content || "").split(/\s+/).length / 200),
      createdAt: now,
      updatedAt: now,
      publishedAt: args.status === "published" ? now : undefined,
    });

    if (args.status === "published") {
      await ctx.scheduler.runAfter(0, internal.articles.queueNewArticleAlerts, {
        articleId,
      });
    }

    return articleId;
  },
});

export const update = mutation({
  args: {
    id: v.id("articles"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    tags: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("published"),
      ),
    ),
    source: v.optional(v.union(v.literal("human"), v.literal("ai"))),
    scheduledFor: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...args }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Article not found");

    // Validation if setting to published
    const finalStatus = args.status || existing.status;
    if (finalStatus !== "draft") {
      const excerpt = args.excerpt || existing.excerpt;
      const content = args.content || existing.content;
      const coverImage = args.coverImage || existing.coverImage;
      const categoryId = args.categoryId || existing.categoryId;
      const tags = args.tags || existing.tags;

      if (!excerpt) throw new Error("Excerpt is required");
      if (!content) throw new Error("Content is required");
      if (!coverImage) throw new Error("Cover Image is required");
      if (!categoryId) throw new Error("Category is required");
      if (!tags || tags.length === 0) throw new Error("Tags are required");
    }

    const patch: Partial<Doc<"articles">> & { updatedAt: number } = {
      ...args,
      updatedAt: Date.now(),
    };

    if (args.content) {
      patch.readingTime = Math.ceil(args.content.split(/\s+/).length / 200);
    }

    if (args.status === "published" && existing.status !== "published") {
      patch.publishedAt = Date.now();
      await ctx.scheduler.runAfter(0, internal.articles.queueNewArticleAlerts, {
        articleId: id,
      });
    }

    await ctx.db.patch(id, patch);
  },
});

export const queueNewArticleAlerts = internalMutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (!article || article.status !== "published") return;

    const author = await ctx.db.get(article.authorId);
    const category = article.categoryId
      ? await ctx.db.get(article.categoryId)
      : null;

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("newsletterSubscribed"), true))
      .collect();

    for (const user of users) {
      await ctx.db.insert("emailQueue", {
        recipient: user.email,
        subject: `New Insight: ${article.title}`,
        templateName: "new_article",
        templateData: {
          articleTitle: article.title,
          excerpt: article.excerpt || "",
          articleUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.com"}/articles/${article.slug}`,
          authorName: author?.name || "The Truth Pill",
          categoryName: category?.name || "Psychology",
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.com"}/unsubscribe?email=${encodeURIComponent(user.email)}`,
        },
        status: "pending",
        scheduledFor: Date.now(),
        retries: 0,
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("articles") },
  handler: async (ctx, args) => {
    // Soft delete
    await ctx.db.patch(args.id, { isArchived: true });
  },
});

export const restore = mutation({
  args: { id: v.id("articles") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isArchived: undefined });
  },
});

export const deleteForever = mutation({
  args: { id: v.id("articles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkArchive = mutation({
  args: { ids: v.array(v.id("articles")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { isArchived: true });
    }
  },
});

export const bulkRestore = mutation({
  args: { ids: v.array(v.id("articles")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { isArchived: undefined });
    }
  },
});

export const bulkDeleteForever = mutation({
  args: { ids: v.array(v.id("articles")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

export const toggleFeatured = mutation({
  args: { id: v.id("articles"), isFeatured: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isFeatured: args.isFeatured });
  },
});

export const listAdmin = query({
  args: {
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    search: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let articles = await ctx.db.query("articles").order("desc").collect();

    if (args.isArchived) {
      articles = articles.filter((a) => a.isArchived === true);
    } else {
      articles = articles.filter((a) => !a.isArchived);
    }

    if (args.status && args.status !== "all") {
      articles = articles.filter((a) => a.status === args.status);
    }

    if (args.source && args.source !== "all") {
      articles = articles.filter((a) => a.source === args.source);
    }

    if (args.search) {
      const query = args.search.toLowerCase();
      articles = articles.filter(
        (a) => a.title.toLowerCase().includes(query) || a.slug.includes(query),
      );
    }

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        let categoryName = "Uncategorized";
        if (article.categoryId) {
          const category = await ctx.db.get(article.categoryId);
          if (category) categoryName = category.name;
        }

        // Safe access
        const authorName = author?.name || "Unknown Author";
        const authorImage = author?.profileImage;

        return {
          ...article,
          authorName,
          authorImage,
          categoryName,
        };
      }),
    );
  },
});

export const getAllTags = query({
  handler: async (ctx) => {
    const articles = await ctx.db.query("articles").collect();
    const tags = new Set<string>();
    articles.forEach((a) => a.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  },
});

export const listAuthors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
  },
});

export const saveAIDraft = internalMutation({
  args: {
    title: v.string(),
    content: v.string(),
    excerpt: v.string(),
    tags: v.array(v.string()),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    let aiAuthor = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "ai@thetruthpill.com"))
      .unique();

    if (!aiAuthor) {
      const aiAuthorId = await ctx.db.insert("users", {
        name: "TruthPill AI",
        email: "ai@thetruthpill.com",
        role: "admin",
        provider: "system",
        newsletterSubscribed: false,
        createdAt: Date.now(),
      });
      aiAuthor = await ctx.db.get(aiAuthorId);
    }

    const category = await ctx.db.query("categories").first();
    if (!category)
      throw new Error("Need at least one category to generate drafts");

    const slug = args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    return await ctx.db.insert("articles", {
      title: args.title,
      slug: slug + "-" + Math.random().toString(36).substring(2, 7),
      excerpt: args.excerpt,
      content: args.content,
      coverImage:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
      authorId: aiAuthor!._id,
      categoryId: category._id,
      tags: args.tags,
      status: "draft",
      source: "ai",
      viewCount: 0,
      uniqueViewCount: 0,
      readingTime: Math.ceil(args.content.split(/\s+/).length / 200),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
export const getByAuthor = query({
  args: { authorId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_authorId", (q) => q.eq("authorId", args.authorId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(args.limit || 50);

    return await Promise.all(
      articles.map(async (article) => {
        const category = article.categoryId
          ? await ctx.db.get(article.categoryId)
          : null;
        return {
          ...article,
          categoryName: category?.name || "Uncategorized",
        };
      }),
    );
  },
});

export const getBookmarkedArticles = query({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email || args.email;
    if (!email) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_article", (q) => q.eq("userId", user._id))
      .collect();

    const articles = await Promise.all(
      bookmarks.map(async (b) => {
        const article = await ctx.db.get(b.articleId);
        if (!article) return null;

        const author = await ctx.db.get(article.authorId);
        const category = article.categoryId
          ? await ctx.db.get(article.categoryId)
          : null;

        return {
          ...article,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category?.name || "Uncategorized",
        };
      }),
    );

    return articles.filter((a): a is NonNullable<typeof a> => a !== null);
  },
});
