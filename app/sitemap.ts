import { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://thetruthpill.com";

  // Fetch articles
  const articles = (await fetchQuery(api.articles.list, {
    limit: 1000,
  })) as Doc<"articles">[];
  const articleUrls = articles.map((article: Doc<"articles">) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: new Date(
      article.updatedAt || article.publishedAt || Date.now(),
    ),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Fetch categories
  const categories = (await fetchQuery(
    api.categories.listAll,
    {},
  )) as (Doc<"categories"> & { articleCount?: number })[];
  const categoryUrls = categories.map((category: Doc<"categories">) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: new Date(category.createdAt || Date.now()),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  return [...staticPages, ...categoryUrls, ...articleUrls];
}
