import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/navbar";
import { BlogGrid } from "@/components/blog-grid";
import { Metadata } from "next";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export const metadata: Metadata = {
    title: "Library of Insights | The Truth Pill",
    description: "A comprehensive collection of psychological deep-dives, cultural observations, and philosophical inquiries.",
    openGraph: {
        title: "Library of Insights | The Truth Pill",
        description: "Deep psychological insights and human-reviewed articles.",
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
        "url": "https://thetruthpill.com/articles",
    };

    return (
        <div className="bg-white min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar solid />
            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 mb-16">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">The Archive</span>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 italic">Library of Insights</h1>
                        <p className="text-zinc-500 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                            A comprehensive collection of psychological deep-dives, cultural observations, and philosophical inquiries.
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
