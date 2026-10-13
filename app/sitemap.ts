import { MetadataRoute } from "next";
import { nest } from "@/lib/api";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // Fetch every published, non-archived article. The list route caps `pageSize`
  // at 100, so page through until `totalPages` is exhausted — dropping URLs from
  // the sitemap is a silent SEO loss.
  const firstPage = await nest.listArticles({ page: 1, pageSize: 100 });
  const allArticles = [...firstPage.items];
  for (let page = 2; page <= firstPage.totalPages; page++) {
    const nextPage = await nest.listArticles({ page, pageSize: 100 });
    allArticles.push(...nextPage.items);
  }

  const articleUrls = allArticles.map((article) => ({
    url: `${baseUrl}/${article.slug}`,
    lastModified: new Date(article.publishedAt || article.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Fetch categories
  const categories = await nest.categories();
  const categoryUrls = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(category.createdAt),
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
