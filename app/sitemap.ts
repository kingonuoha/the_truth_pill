import { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  interface ArticleWithMeta {
    slug: string;
    updatedAt: number;
    publishedAt?: number;
  }

  // Fetch articles
  const articles = (await fetchQuery(api.articles.listRecent, {
    limit: 1000,
  })) as ArticleWithMeta[];

  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/${article.slug}`,
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
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(category.createdAt || Date.now()),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pillars`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // Combine entries
  return [
    ...staticPages,
    ...categoryUrls,
    ...articleUrls,
  ];
}
