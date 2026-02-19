import { Navbar } from "@/components/navbar";
import { HeroCarousel } from "@/components/hero-carousel";
import { BlogGrid } from "@/components/blog-grid";
import { CategoryShowcase } from "@/components/category-showcase";
import { Newsletter } from "@/components/newsletter";
import { LogoStrip } from "@/components/logo-strip";
import { SplitFeature } from "@/components/split-feature";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { JoinedArticle } from "@/components/blog-grid";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export const metadata: Metadata = {
  title: "The Truth Pill | Unfiltered Insights into Human Behavior",
  description: "Join 50,000+ seekers getting weekly insights that challenge conventional perception.",
  openGraph: {
    title: "The Truth Pill | Unfiltered Insights into Human Behavior",
    description: "Deep psychological insights and human-reviewed articles on behavior, relationships, and self-awareness.",
    url: "https://thetruthpill.com",
    siteName: "The Truth Pill",
    images: [
      {
        url: "https://thetruthpill.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};

export default async function Home() {
  const [featuredArticles, latestArticles] = await Promise.all([
    fetchQuery(api.articles.getFeatured, { limit: 5 }),
    fetchQuery(api.articles.list, { limit: 6 }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "The Truth Pill",
    "url": "https://thetruthpill.com",
    "description": "Unfiltered insight into human behavior and psychology.",
    "publisher": {
      "@type": "Organization",
      "name": "The Truth Pill",
      "logo": {
        "@type": "ImageObject",
        "url": "https://thetruthpill.com/logo.png",
      },
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://thetruthpill.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* Hero Section */}
      <section id="hero">
        <HeroCarousel initialArticles={featuredArticles} />
      </section>

      {/* Trust Section */}
      <LogoStrip />

      {/* Methodology Section */}
      <SplitFeature />

      {/* Content Showcase Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
                Latest Insights
              </h2>
              <h3 className="text-4xl font-serif font-black text-gray-900 dark:text-white">
                Deep dives into the <span className="italic">extraordinary.</span>
              </h3>
            </div>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors group"
            >
              View all articles
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <BlogGrid initialArticles={latestArticles as JoinedArticle[]} />
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/30 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
              Explore Topics
            </h2>
            <h3 className="text-4xl font-serif font-black text-gray-900 dark:text-white mb-4">
              Categorized for <span className="italic">clarity.</span>
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Browse our curated collections of wisdom, from psychology to societal transitions.
            </p>
          </div>
          <CategoryShowcase />
        </div>
      </section>

      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-6 py-24 mb-24">
        <Newsletter />
      </div>
    </main>
  );
}
