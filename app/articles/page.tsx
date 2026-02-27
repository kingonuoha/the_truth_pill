import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/navbar";
import { BlogGrid } from "@/components/blog-grid";
import { Metadata } from "next";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export const metadata: Metadata = {
    title: "All Articles | The Truth Pill",
    description: "Read all our stories about how people think and act.",
    openGraph: {
        title: "All Articles | The Truth Pill",
        description: "Simple stories to help you understand life and people.",
        type: "website",
    },
};

export default async function ArticlesPage() {
    const initialArticles = await fetchQuery(api.articles.list, { limit: 12 });

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Library of Insights",
        "description": "A comprehensive collection of psychological deep-dives, cultural observations, and philosophical inquiries.",
        "url": "https://thetruthpill.org/articles",
    };

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen transition-colors duration-500">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar solid />
            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 mb-16">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 dark:text-blue-400 mb-4 block">The Collection</span>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 italic text-gray-900 dark:text-white">Our Stories</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                            Read all our articles to learn new things about yourself and the people around you.
                        </p>
                    </div>
                </div>

                <div className="animate-in fade-in duration-1000">
                    <BlogGrid initialArticles={initialArticles} />
                </div>
            </main>
        </div>
    );
}
