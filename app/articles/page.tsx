import { Navbar } from "@/components/navbar";
import { BlogGrid } from "@/components/blog-grid";
import { Newsletter } from "@/components/newsletter";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { JoinedArticle } from "@/components/blog-grid";
import { CategoryShowcase } from "@/components/category-showcase";
import { getCanonical } from "@/lib/site-url";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Insights & Articles | The Truth Pill",
  description: "Explore our full archive of insights into human behavior and psychology.",
  alternates: {
    canonical: getCanonical("articles"),
  },
};

export default async function ArticlesPage() {
  const initialArticles = await fetchQuery(api.articles.list, { 
    paginationOpts: { numItems: 12, cursor: null } 
  });

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar solid={true} />
      
      <section className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-20">
            <h1 className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
              Article Archive
            </h1>
            <h2 className="text-5xl md:text-6xl font-serif font-black text-gray-900 dark:text-white max-w-3xl leading-tight">
              Explore the <span className="italic">full collection of truths.</span>
            </h2>
            <p className="mt-8 text-gray-500 dark:text-gray-400 italic text-lg max-w-2xl leading-relaxed">
              From evolutionary psychology to modern social dynamics, dive deep into why we do what we do. 
              Our archive contains structured insights designed to help you navigate human nature with clarity.
            </p>
          </div>
          
          <BlogGrid initialArticles={initialArticles.page as JoinedArticle[]} initialCursor={initialArticles.continueCursor} initialHasMore={!initialArticles.isDone} />
        </div>
      </section>

      {/* Category Explorer Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/30 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
              Explore Topics
            </h2>
            <h3 className="text-4xl font-serif font-black text-gray-900 dark:text-white mb-4">
              Choose what you want to <span className="italic">learn next.</span>
            </h3>
          </div>
          <CategoryShowcase />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-24">
        <Newsletter />
      </div>
    </main>
  );
}
