import { mutation } from "./_generated/server";

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create a default author if not exists
    let author = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@thetruthpill.com"))
      .unique();

    if (!author) {
      const authorId = await ctx.db.insert("users", {
        name: "Truth Seeker",
        email: "admin@thetruthpill.com",
        role: "admin",
        provider: "email",
        newsletterSubscribed: true,
        createdAt: Date.now(),
      });
      author = await ctx.db.get(authorId);
    }

    if (!author) throw new Error("Failed to create author");

    // 2. Create categories if not exist
    const categoryData = [
      {
        name: "Philosophy",
        slug: "philosophy",
        description: "Deep dives into the nature of reality.",
      },
      {
        name: "Science",
        slug: "science",
        description: "The verifiable truth about our universe.",
      },
      {
        name: "Psychology",
        slug: "psychology",
        description: "Understanding the human mind.",
      },
      {
        name: "Society",
        slug: "society",
        description: "Analyzing the structures we live in.",
      },
    ];

    const savedCategories = [];
    for (const cat of categoryData) {
      let existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", cat.slug))
        .unique();

      if (!existing) {
        const id = await ctx.db.insert("categories", {
          ...cat,
          articleCount: 0,
          createdAt: Date.now(),
        });
        existing = await ctx.db.get(id);
      }
      if (existing) savedCategories.push(existing);
    }

    // 3. Create 5 blog articles
    const articles = [
      {
        title: "The Illusion of Certainty",
        slug: "illusion-of-certainty",
        excerpt:
          "Why our brain craves absolute truths in an inherently uncertain world.",
        content:
          "## The Human Need for Order\n\nWe live in a world of complexity, yet we seek simplicity. This article explores why certainty is often a comfort rather than a reality...",
        coverImage:
          "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1200",
        categoryId: savedCategories[0]._id,
        tags: ["philosophy", "truth", "reality"],
      },
      {
        title: "Neuroscience of Belief",
        slug: "neuroscience-of-belief",
        excerpt:
          "How neural pathways form the bedrock of our strongest convictions.",
        content:
          "## Wiring the Mind\n\nOur beliefs are not just abstract thoughts; they are physical structures in our brain. Understanding how they form is crucial for growth...",
        coverImage:
          "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=1200",
        categoryId: savedCategories[2]._id,
        tags: ["science", "brain", "psychology"],
      },
      {
        title: "Quantum Reality: Beyond Observation",
        slug: "quantum-reality-beyond-observation",
        excerpt:
          "Exploring the strange world where variables don't exist until measured.",
        content:
          "## The Observer Effect\n\nIn the quantum realm, the act of looking changes what is seen. This fundamental truth challenges our traditional view of the objective world...",
        coverImage:
          "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200",
        categoryId: savedCategories[1]._id,
        tags: ["science", "physics", "quantum"],
      },
      {
        title: "The Architecture of Social Control",
        slug: "architecture-of-social-control",
        excerpt:
          "How modern digital structures subtly shape our behavior and choices.",
        content:
          "## Soft Power\n\nControl in the 21st century is not about force; it is about architecture. The platforms we use every day are designed with specific outcomes in mind...",
        coverImage:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
        categoryId: savedCategories[3]._id,
        tags: ["society", "tech", "control"],
      },
      {
        title: "Stoicism in the Age of Noise",
        slug: "stoicism-age-of-noise",
        excerpt:
          "Ancient wisdom for maintaining internal clarity in a chaotic digital environment.",
        content:
          "## Finding Silence\n\nMarcus Aurelius never had a smartphone, yet his meditations on internal peace are more relevant today than ever before...",
        coverImage:
          "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=1200",
        categoryId: savedCategories[0]._id,
        tags: ["philosophy", "stoicism", "mental-health"],
      },
    ];

    for (const art of articles) {
      const existing = await ctx.db
        .query("articles")
        .withIndex("by_slug", (q) => q.eq("slug", art.slug))
        .unique();

      if (!existing) {
        await ctx.db.insert("articles", {
          ...art,
          authorId: author._id,
          status: "published",
          source: "human",
          viewCount: Math.floor(Math.random() * 1000),
          uniqueViewCount: Math.floor(Math.random() * 500),
          readingTime: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          publishedAt: Date.now(),
          isFeatured: Math.random() > 0.5,
        });
      }
    }

    return "Seeding completed successfully!";
  },
});
