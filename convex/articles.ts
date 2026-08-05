import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const publishScheduledArticles = internalMutation({
  args: { _dummy: v.optional(v.string()) },
  handler: async (ctx) => {
    const now = Date.now();
    const scheduledArticles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .filter((q) => q.lte(q.field("scheduledFor"), now))
      .collect();

    for (const article of scheduledArticles) {
      await ctx.db.patch(article._id, {
        status: "published",
        publishedAt: now,
      });

      // Also queue alerts for the newly published article
      await ctx.scheduler.runAfter(0, internal.articles.queueNewArticleAlerts, {
        articleId: article._id,
      });

      // Update globalStats
      await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
        update: {
          publishedArticles: 1,
          scheduledArticles: -1,
        },
      });
    }

    return { publishedCount: scheduledArticles.length };
  },
});


export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    pillar: v.optional(v.string()),
    type: v.optional(v.string()),
    _test: v.optional(v.string()), // Kept for compat
  },
  handler: async (ctx, args) => {
    let articleQuery = ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"));

    if (args.categoryId) {
      articleQuery = ctx.db
        .query("articles")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId as Id<"categories">));
    }

    // Apply native DB filters
    const qBase = articleQuery.filter((q) => {
      const conditions: ReturnType<typeof q.eq>[] = [];
      conditions.push(q.neq(q.field("isArchived"), true));
      
      if (args.categoryId) {
         conditions.push(q.eq(q.field("status"), "published"));
      }
      
      if (args.pillar) {
         conditions.push(q.eq(q.field("pillar"), args.pillar));
      }
      if (args.type) {
         conditions.push(q.eq(q.field("type"), args.type));
      }

      return conditions.length > 1 ? q.and(...conditions) : conditions[0];
    });

    const result = await qBase.order("desc").paginate(args.paginationOpts);

    const projectedPage = await Promise.all(
      result.page.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const category = article.categoryId
          ? await ctx.db.get(article.categoryId)
          : null;
        
        return {
          _id: article._id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          publishedAt: article.publishedAt,
          createdAt: article.createdAt,
          viewCount: article.viewCount,
          authorId: article.authorId,
          categoryId: article.categoryId,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category?.name || "Uncategorized",
        };
      }),
    );

    return { ...result, page: projectedPage };
  },
});

/**
 * Lightweight query for recent articles targeting SSR callers (Home, Sitemap, etc.)
 * Prevents full table scans by using .take(n) and projects only necessary fields.
 */
export const listRecent = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .order("desc")
      .take(Math.min(args.limit, 100)); // Hard cap at 100 for safety

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const category = article.categoryId
          ? await ctx.db.get(article.categoryId)
          : null;
        
        return {
          _id: article._id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category?.name || "Uncategorized",
          viewCount: article.viewCount || 0,
        };
      }),
    );
  },
});

export const listByTag = query({
  args: { tag: v.string() },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .take(500);

    const tagged = articles.filter((a) => a.tags?.includes(args.tag));

    return await Promise.all(
      tagged.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const category = article.categoryId
          ? await ctx.db.get(article.categoryId)
          : null;

        return {
          _id: article._id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category?.name || "Uncategorized",
          viewCount: article.viewCount || 0,
          tags: article.tags || [],
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
      .filter((q) => q.neq(q.field("isArchived"), true))
      .unique();

    if (!article || article.status !== "published") return null;

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
      .filter((q) => 
        q.and(
          q.eq(q.field("isFeatured"), true),
          q.neq(q.field("isArchived"), true)
        )
      )
      .order("desc")
      .take(args.limit || 5);

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const category = article.categoryId
          ? await ctx.db.get(article.categoryId)
          : null;
        return {
          _id: article._id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          publishedAt: article.publishedAt,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category?.name || "Uncategorized",
          viewCount: article.viewCount || 0,
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
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "published"),
          q.neq(q.field("isArchived"), true)
        )
      )
      .order("desc")
      .take(args.limit || 100);

    return await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        return {
          _id: article._id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          publishedAt: article.publishedAt,
          authorName: author?.name || "Unknown Author",
          authorImage: author?.profileImage,
          categoryName: category.name,
          viewCount: article.viewCount || 0,
        };
      }),
    );
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query) return [];

    const q = args.query.toLowerCase();

    // 1. Fetch data needed for filtering and augmentation with safety limits
    const [articles, categories, allPillars] = await Promise.all([
      ctx.db
        .query("articles")
        .withIndex("by_status", (qb) => qb.eq("status", "published"))
        .filter((qb) => qb.neq(qb.field("isArchived"), true))
        .order("desc")
        .take(300), // Limit search scope to most recent 300
      ctx.db.query("categories").take(100),
      ctx.db.query("pillars").take(100),
    ]);

    // Create maps for quick lookup
    const categoryMap = new Map(categories.map((c) => [c._id, c]));
    const pillarMap = new Map(allPillars.map((p) => [p.slug, p]));

    const matched = articles.filter((a) => {
      const inTitle = a.title.toLowerCase().includes(q);
      const inExcerpt = a.excerpt?.toLowerCase().includes(q) || false;
      const inFocusKeyword = a.focusKeyword?.toLowerCase().includes(q) || false;
      const inTopics = a.topics?.some((t) => t.toLowerCase().includes(q)) || false;
      const inTags = a.tags?.some((t) => t.toLowerCase().includes(q)) || false;

      // Check Category
      const category = a.categoryId ? categoryMap.get(a.categoryId) : null;
      const inCategory = category?.name.toLowerCase().includes(q) || false;

      // Check Pillar
      const pillar = a.pillar ? pillarMap.get(a.pillar) : null;
      const inPillar = pillar?.name.toLowerCase().includes(q) || false;

      return (
        inTitle ||
        inExcerpt ||
        inFocusKeyword ||
        inTopics ||
        inTags ||
        inCategory ||
        inPillar
      );
    });

    // Augment results with category/pillar names and author info
    return await Promise.all(matched.slice(0, 10).map(async (a) => {
      const category = a.categoryId ? categoryMap.get(a.categoryId) : null;
      const pillar = a.pillar ? pillarMap.get(a.pillar) : null;
      const author = await ctx.db.get(a.authorId);
      
      return {
        _id: a._id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        coverImage: a.coverImage,
        publishedAt: a.publishedAt,
        categoryName: category?.name || "Unknown",
        pillarName: pillar?.name || null,
        authorName: author?.name || "Unknown Author",
        authorImage: author?.profileImage,
        viewCount: a.viewCount || 0,
      };
    }));
  },
});

export const getPopularTopics = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(100);

    const topicCounts: Record<string, number> = {};
    articles.forEach((article) => {
      article.topics?.forEach((topic) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, args.limit || 20)
      .map(([topic]) => topic);
  },
});

// getAllTags removed in favor of getAllTopics below

export const getAllTopics = query({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(500); // Limit topics analysis to most recent 500

    const topics = new Set<string>();
    articles.forEach((article) => {
      article.topics?.forEach((topic) => topics.add(topic));
    });
 
    return Array.from(topics).sort((a, b) => a.localeCompare(b));
  },
});

export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(500); // Limit tags analysis to recent articles

    const tags = new Set<string>();
    articles.forEach((article) => {
      article.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  },
});

export const getTopPostTags = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Get recent published articles to find top tags
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .take(200);

    const topArticles = [...articles]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 2); // Hardcoded to top 2 as per requirement

    const tagSet = new Set<string>();
    topArticles.forEach((a) => a.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).slice(0, args.limit || 5);
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
    pillar: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
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
    scheduledFor: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),
    coverImageAlt: v.optional(v.string()),
    adminEmail: v.optional(v.string()),
    authorId: v.optional(v.id("users")),
  },
  handler: async (ctx, { adminEmail, authorId: providedAuthorId, ...args }) => {
    // Validation for non-drafts
    if (args.status !== "draft") {
      if (!args.excerpt) throw new Error("Excerpt is required for publishing");
      if (!args.content) throw new Error("Content is required for publishing");
      if (!args.coverImage)
        throw new Error("Cover Image is required for publishing");
      if (!args.categoryId)
        throw new Error("Category is required for publishing");
      if (!args.topics || args.topics.length === 0)
        throw new Error("Topics are required for publishing");
      if (args.topics.length > 1)
        throw new Error("Only one topic is allowed per article.");
      if (!args.tags || args.tags.length < 4)
        throw new Error("At least 4 tags are required for publishing");

      // Enhanced SEO checks
      if (!args.metaTitle)
        throw new Error("Meta Title is required for publishing");
      if (!args.metaDescription)
        throw new Error("Meta Description is required for publishing");
      if (args.metaDescription.length > 255)
        throw new Error("Meta Description must be 255 characters or less");

      // Character count check (800 characters minimum)
      const charCount = (args.content || "").length;
      if (charCount < 800) {
        throw new Error(
          `Article content is too short (${charCount} characters). Minimum 800 characters required for publication.`,
        );
      }

      // H2 check
      if (!args.content.includes("<h2")) {
        throw new Error(
          "At least one H2 subheading is required for SEO structure.",
        );
      }
    }
    // Get current user as author
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email || adminEmail;
    if (!email) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user || user.role !== "admin") throw new Error("Unauthorized");

    // Reject slugs already claimed by another article
    const slugTaken = await ctx.db
      .query("articles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (slugTaken) throw new Error("Slug already exists");

    const now = Date.now();
    const articleId = await ctx.db.insert("articles", {
      ...args,
      isArchived: false,
      authorId: providedAuthorId || user._id,
      viewCount: 0,
      uniqueViewCount: 0,
      readingTime: Math.ceil((args.content || "").length / 1300),
      createdAt: now,
      updatedAt: now,
      publishedAt: args.status === "published" ? now : undefined,
    });

    if (args.status === "published") {
      await ctx.scheduler.runAfter(0, internal.articles.queueNewArticleAlerts, {
        articleId,
      });
    }

    // Update globalStats
    await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
      update: {
        totalArticles: 1,
        publishedArticles: args.status === "published" ? 1 : 0,
        draftArticles: args.status === "draft" ? 1 : 0,
        scheduledArticles: args.status === "scheduled" ? 1 : 0,
      },
    });

    // Update Category Stats
    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (category) {
        await ctx.db.patch(category._id, {
          articleCount: (category.articleCount || 0) + 1,
        });
      }
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
    pillar: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    type: v.optional(
      v.union(
        v.literal("pillar"),
        v.literal("cluster"),
        v.literal("micro"),
        v.literal("insight"),
        v.literal("observant"),
      ),
    ),
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
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),
    coverImageAlt: v.optional(v.string()),
    adminEmail: v.optional(v.string()),
    authorId: v.optional(v.id("users")),
  },
  handler: async (ctx, { id, adminEmail, ...args }) => {
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email || adminEmail;

    const user = email
      ? await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique()
      : null;

    if (!user || user.role !== "admin") throw new Error("Unauthorized");

    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Article not found");

    // Reject a slug already used by another article (self excluded)
    if (args.slug && args.slug !== existing.slug) {
      const newSlug = args.slug;
      const slugRows = await ctx.db
        .query("articles")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .take(2);
      const conflict = slugRows.find((a) => a._id !== id);
      if (conflict) throw new Error("Slug already exists");
    }

    // Validation if setting to published
    const finalStatus = args.status || existing.status;
    if (finalStatus !== "draft") {
      const excerpt = args.excerpt || existing.excerpt;
      const content = args.content || existing.content;
      const coverImage = args.coverImage || existing.coverImage;
      const categoryId = args.categoryId || existing.categoryId;
      const topics = args.topics || existing.topics;

      if (!excerpt) throw new Error("Excerpt is required");
      if (!content) throw new Error("Content is required");
      if (!coverImage) throw new Error("Cover Image is required");
      if (!categoryId) throw new Error("Category is required");
      if (!topics || topics.length === 0) throw new Error("Topics are required");
      if (topics.length > 1) throw new Error("Only one topic is allowed per article.");

      const tagsVal = args.tags ?? existing.tags;
      if (!tagsVal || tagsVal.length < 4) throw new Error("At least 4 tags are required for publishing");

      // Enhanced SEO checks
      const metaTitle = args.metaTitle || existing.metaTitle;
      const metaDescription = args.metaDescription || existing.metaDescription;

      if (!metaTitle) throw new Error("Meta Title is required");
      if (!metaDescription) throw new Error("Meta Description is required");
      if (metaDescription.length > 255)
        throw new Error("Meta Description must be 255 characters or less");

      // Character count check (800 characters minimum)
      const charCount = (content || "").length;
      if (charCount < 800) {
        throw new Error(
          `Article content is too short (${charCount} characters). Minimum 800 characters required for publication.`,
        );
      }

      // H2 check
      if (!content || !content.includes("<h2")) {
        throw new Error(
          "At least one H2 subheading is required for SEO structure.",
        );
      }
    }

    const patch: Partial<Doc<"articles">> & { updatedAt: number } = {
      ...args,
      updatedAt: Date.now(),
    };

    if (args.content) {
      patch.readingTime = Math.ceil(args.content.length / 1300);
    }

    if (args.status === "published" && existing.status !== "published") {
      patch.publishedAt = Date.now();
      await ctx.scheduler.runAfter(0, internal.articles.queueNewArticleAlerts, {
        articleId: id,
      });
    }

    await ctx.db.patch(id, patch);

    // Update Category Stats if category changed
    if (args.categoryId && args.categoryId !== existing.categoryId) {
      // Decrement old category
      if (existing.categoryId) {
        const oldCat = await ctx.db.get(existing.categoryId);
        if (oldCat) {
          await ctx.db.patch(oldCat._id, {
            articleCount: Math.max(0, (oldCat.articleCount || 0) - 1),
          });
        }
      }
      // Increment new category
      const newCat = await ctx.db.get(args.categoryId);
      if (newCat) {
        await ctx.db.patch(newCat._id, {
          articleCount: (newCat.articleCount || 0) + 1,
        });
      }
    }

    // Update globalStats if status changed
    if (args.status && args.status !== existing.status) {
      await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
        update: {
          totalArticles: 0,
          publishedArticles:
            args.status === "published" ? 1 : existing.status === "published" ? -1 : 0,
          draftArticles:
            args.status === "draft" ? 1 : existing.status === "draft" ? -1 : 0,
          scheduledArticles:
            args.status === "scheduled" ? 1 : existing.status === "scheduled" ? -1 : 0,
          aiDraftCount:
            existing.source === "ai"
              ? (args.status === "draft" ? 1 : existing.status === "draft" ? -1 : 0)
              : 0,
        },
      });
    }
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
          articleUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.org"}/${article.slug}`,
          authorName: author?.name || "The Truth Pill",
          categoryName: category?.name || "Psychology",
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.org"}/unsubscribe?email=${encodeURIComponent(user.email)}`,
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
    const article = await ctx.db.get(args.id);
    if (article && !article.isArchived) {
      // We don't delete for real here yet (it's called "remove" but archives)
      await ctx.db.patch(args.id, { isArchived: true });

      // Update globalStats (decrement counts as it's no longer 'active')
      await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
        update: {
          totalArticles: -1,
          publishedArticles: article.status === "published" ? -1 : 0,
          draftArticles: article.status === "draft" ? -1 : 0,
          scheduledArticles: article.status === "scheduled" ? -1 : 0,
          aiDraftCount: article.source === "ai" && article.status === "draft" ? -1 : 0,
        },
      });

      // Update Category Stats
      if (article.categoryId) {
        const category = await ctx.db.get(article.categoryId);
        if (category) {
          await ctx.db.patch(category._id, {
            articleCount: Math.max(0, (category.articleCount || 0) - 1),
          });
        }
      }
    }
  },
});

export const restore = mutation({
  args: { id: v.id("articles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (article && article.isArchived) {
      await ctx.db.patch(args.id, { isArchived: false });

      // Update globalStats (increment counts as it's back to 'active')
      await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
        update: {
          totalArticles: 1,
          publishedArticles: article.status === "published" ? 1 : 0,
          draftArticles: article.status === "draft" ? 1 : 0,
          scheduledArticles: article.status === "scheduled" ? 1 : 0,
          aiDraftCount: article.source === "ai" && article.status === "draft" ? 1 : 0,
        },
      });

      // Update Category Stats
      if (article.categoryId) {
        const category = await ctx.db.get(article.categoryId);
        if (category) {
          await ctx.db.patch(category._id, {
            articleCount: (category.articleCount || 0) + 1,
          });
        }
      }
    }
  },
});

export const deleteForever = mutation({
  args: { id: v.id("articles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (article) {
      await ctx.db.delete(args.id);
      
      // Update globalStats
      await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
        update: {
          totalArticles: -1,
          publishedArticles: article.status === "published" ? -1 : 0,
          draftArticles: article.status === "draft" ? -1 : 0,
          scheduledArticles: article.status === "scheduled" ? -1 : 0,
          aiDraftCount: article.source === "ai" && article.status === "draft" ? -1 : 0,
        },
      });

      // Update Category Stats (only if not already archived)
      if (article.categoryId && !article.isArchived) {
        const category = await ctx.db.get(article.categoryId);
        if (category) {
          await ctx.db.patch(category._id, {
            articleCount: Math.max(0, (category.articleCount || 0) - 1),
          });
        }
      }
    }
  },
});

export const bulkArchive = mutation({
  args: { ids: v.array(v.id("articles")) },
  handler: async (ctx, args) => {
    let totalCount = 0;
    let publishedCount = 0;
    let draftCount = 0;
    let scheduledCount = 0;
    let aiDraftCount = 0;
    const categoryUpdates = new Map<Id<"categories">, number>();

    for (const id of args.ids) {
      const article = await ctx.db.get(id);
      if (article && !article.isArchived) {
        await ctx.db.patch(id, { isArchived: true });
        
        totalCount++;
        if (article.status === "published") publishedCount++;
        if (article.status === "draft") draftCount++;
        if (article.status === "scheduled") scheduledCount++;
        if (article.source === "ai" && article.status === "draft") aiDraftCount++;

        if (article.categoryId) {
          categoryUpdates.set(article.categoryId, (categoryUpdates.get(article.categoryId) || 0) + 1);
        }
      }
    }

    if (totalCount > 0) {
      await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
        update: {
          totalArticles: -totalCount,
          publishedArticles: -publishedCount,
          draftArticles: -draftCount,
          scheduledArticles: -scheduledCount,
          aiDraftCount: -aiDraftCount,
        },
      });

      for (const [catId, count] of categoryUpdates.entries()) {
        const category = await ctx.db.get(catId);
        if (category) {
          await ctx.db.patch(catId, {
            articleCount: Math.max(0, (category.articleCount || 0) - count),
          });
        }
      }
    }
  },
});

export const bulkRestore = mutation({
  args: { ids: v.array(v.id("articles")) },
  handler: async (ctx, args) => {
    let totalCount = 0;
    let publishedCount = 0;
    let draftCount = 0;
    let scheduledCount = 0;
    let aiDraftCount = 0;
    const categoryUpdates = new Map<Id<"categories">, number>();

    for (const id of args.ids) {
      const article = await ctx.db.get(id);
      if (article && article.isArchived) {
        await ctx.db.patch(id, { isArchived: false });
        
        totalCount++;
        if (article.status === "published") publishedCount++;
        if (article.status === "draft") draftCount++;
        if (article.status === "scheduled") scheduledCount++;
        if (article.source === "ai" && article.status === "draft") aiDraftCount++;

        if (article.categoryId) {
          categoryUpdates.set(article.categoryId, (categoryUpdates.get(article.categoryId) || 0) + 1);
        }
      }
    }

    if (totalCount > 0) {
      await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
        update: {
          totalArticles: totalCount,
          publishedArticles: publishedCount,
          draftArticles: draftCount,
          scheduledArticles: scheduledCount,
          aiDraftCount: aiDraftCount,
        },
      });

      for (const [catId, count] of categoryUpdates.entries()) {
        const category = await ctx.db.get(catId);
        if (category) {
          await ctx.db.patch(catId, {
            articleCount: (category.articleCount || 0) + count,
          });
        }
      }
    }
  },
});

export const bulkDeleteForever = mutation({
  args: { ids: v.array(v.id("articles")) },
  handler: async (ctx, args) => {
    let totalCount = 0;
    let publishedCount = 0;
    let draftCount = 0;
    let scheduledCount = 0;
    let aiDraftCount = 0;
    const categoryUpdates = new Map<Id<"categories">, number>();

    for (const id of args.ids) {
      const article = await ctx.db.get(id);
      if (article) {
        await ctx.db.delete(id);
        
        totalCount++;
        if (article.status === "published") publishedCount++;
        if (article.status === "draft") draftCount++;
        if (article.status === "scheduled") scheduledCount++;
        if (article.source === "ai" && article.status === "draft") aiDraftCount++;

        // Only decrement category count if it wasn't already archived
        if (article.categoryId && !article.isArchived) {
          categoryUpdates.set(article.categoryId, (categoryUpdates.get(article.categoryId) || 0) + 1);
        }
      }
    }

    if (totalCount > 0) {
      await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
        update: {
          totalArticles: -totalCount,
          publishedArticles: -publishedCount,
          draftArticles: -draftCount,
          scheduledArticles: -scheduledCount,
          aiDraftCount: -aiDraftCount,
        },
      });

      for (const [catId, count] of categoryUpdates.entries()) {
        const category = await ctx.db.get(catId);
        if (category) {
          await ctx.db.patch(catId, {
            articleCount: Math.max(0, (category.articleCount || 0) - count),
          });
        }
      }
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
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    search: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 1. Handle Search Case (Highest Priority & Performance)
    if (args.search) {
      const result = await ctx.db
        .query("articles")
        .withSearchIndex("search_title", (q) => {
          let searchQ = q.search("title", args.search!);
          if (args.status && args.status !== "all") searchQ = searchQ.eq("status", args.status as Doc<"articles">["status"]);
          if (args.categoryId) searchQ = searchQ.eq("categoryId", args.categoryId);
          if (args.isArchived === true) {
            searchQ = searchQ.eq("isArchived", true);
          } else {
            searchQ = searchQ.eq("isArchived", false);
          }
          return searchQ;
        })
        .paginate(args.paginationOpts);

      return {
        ...result,
        page: await Promise.all(
          result.page.map(async (article) => {
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
        ),
      };
    }

    // 2. Handle Browsing Case (Indexed)
    let articleQuery;

    if (args.status && args.status !== "all" && args.categoryId) {
      articleQuery = ctx.db.query("articles").withIndex("by_status_category", (q) => q.eq("status", args.status as Doc<"articles">["status"]).eq("categoryId", args.categoryId!));
    } else if (args.categoryId) {
      articleQuery = ctx.db.query("articles").withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!));
    } else if (args.status && args.status !== "all") {
      articleQuery = ctx.db.query("articles").withIndex("by_status", (q) => q.eq("status", args.status as Doc<"articles">["status"]));
    } else {
      articleQuery = ctx.db.query("articles");
    }

    // Apply filters for non-indexable fields
    const filteredQuery = articleQuery.filter((q) => {
      const conditions = [];
      
      if (args.isArchived === true) {
        conditions.push(q.eq(q.field("isArchived"), true));
      } else {
        conditions.push(q.neq(q.field("isArchived"), true));
      }

      if (args.source && args.source !== "all") {
        conditions.push(q.eq(q.field("source"), args.source as Doc<"articles">["source"]));
      }

      if (args.status && args.status !== "all") {
        conditions.push(q.eq(q.field("status"), args.status as Doc<"articles">["status"]));
      }

      // If no filters, match all (using a non-existent ID for neq)
      return conditions.length > 0 ? q.and(...conditions) : q.neq(q.field("_id"), "00000000000000000000000000" as Id<"articles">);
    });

    const result = await filteredQuery.order("desc").paginate(args.paginationOpts);

    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (article) => {
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
      ),
    };
  },
});

export const listAuthors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .take(100);
  },
});

export const saveAIDraft = internalMutation({
  args: {
    title: v.string(),
    content: v.string(),
    excerpt: v.string(),
     pillar: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
    type: v.optional(
      v.union(
        v.literal("pillar"),
        v.literal("cluster"),
        v.literal("micro"),
        v.literal("insight"),
        v.literal("observant"),
      ),
    ),
    topic: v.string(),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      metaTitle,
      metaDescription,
      focusKeyword,
      topic,
      ...rest
    } = args;
    void topic;
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    let authorId: Id<"users">;

    if (admins.length > 0) {
      // Pick a random admin
      const randomAdmin = admins[Math.floor(Math.random() * admins.length)];
      authorId = randomAdmin._id;
    } else {
      // Fallback: create/get system AI author
      const aiAuthor = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "ai@thetruthpill.org"))
        .unique();

      if (!aiAuthor) {
        authorId = await ctx.db.insert("users", {
          name: "TruthPill AI",
          email: "ai@thetruthpill.org",
          role: "admin",
          provider: "system",
          newsletterSubscribed: false,
          createdAt: Date.now(),
        });
      } else {
        authorId = aiAuthor._id;
      }
    }

    const category = await ctx.db.query("categories").first();
    if (!category)
      throw new Error("Need at least one category to generate drafts");

    const slug = args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newArticleId = await ctx.db.insert("articles", {
      ...rest,
      metaTitle,
      metaDescription,
      focusKeyword,
      isArchived: false,
      slug: slug + "-" + Math.random().toString(36).substring(2, 7),
      coverImage:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
      authorId,
      categoryId: category._id,
      status: "draft",
      source: "ai",
      viewCount: 0,
      uniqueViewCount: 0,
      readingTime: Math.ceil(rest.content.length / 1300),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update global stats
    await ctx.scheduler.runAfter(0, internal.stats.incrementStats, {
      update: {
        totalArticles: 1,
        draftArticles: 1,
        aiDraftCount: 1,
      },
    });

    // Update category stats
    await ctx.db.patch(category._id, {
      articleCount: (category.articleCount || 0) + 1,
    });

    return newArticleId;
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
      .take(200); // Safety cap for bookmarks per user

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





