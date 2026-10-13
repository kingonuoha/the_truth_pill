import { nest } from "@/lib/api";
import type { CategoryListItem } from "@/lib/content-types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { DynamicCategoryImage } from "@/components/dynamic-category-image";
import { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export const metadata: Metadata = {
    title: "Article Categories | The Truth Pill",
    description: "Discover deep psychological research and unfiltered insights across our core pillars.",
    openGraph: {
        title: "Explore Article Categories",
        description: "Browse curated categories of psychological and behavioral insights.",
        type: "website",
    },
};

export default async function CategoriesPage() {
    const categories = await nest.categories();

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Article Categories",
        "description": "Discover deep psychological research and unfiltered insights across our core pillars.",
        "url": "https://thetruthpill.org/category",
    };

    return (
        <div className="bg-[#f8f9fa] min-h-screen font-sans">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar solid />
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">Article Categories</span>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 text-zinc-900">Explore our Pillars</h1>
                        <p className="text-zinc-500 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                            Discover deep psychological research and unfiltered insights across our core behavioral pillars.
                        </p>
                    </div>

                    {categories && categories.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {categories.map((category) => (
                                <CategoryCard key={category.id} category={category} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            title="No Pillars Found" 
                            description="Our core research pillars are being established. Check back soon for our primary dimensions of reality."
                            illustration="Empty-folder.svg"
                            action={
                                <Link 
                                    href="/category"
                                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-xl active:scale-95"
                                >
                                    Explore Other Pillars
                                </Link>
                            }
                        />
                    )}

                </div>
            </main>
        </div>
    );
}

function CategoryCard({ category }: { category: CategoryListItem }) {
    return (
        <Link
            href={`/category/${category.slug}`}
            className="group relative h-[450px] rounded-[48px] overflow-hidden shadow-xl shadow-zinc-200/50 hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-700"
        >
            <DynamicCategoryImage
                categoryName={category.name}
                coverImage={category.coverImage ?? undefined}
                pexelsImages={category.pexelsImages}
                alt={category.name}
                className="transition-transform duration-[2000ms] group-hover:scale-125"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />

            <div className="absolute inset-0 p-10 flex flex-col justify-end">
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-10 h-[2px] bg-primary group-hover:w-16 transition-all duration-700" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
                        {category.articleCount || 0} Articles
                    </span>
                </div>
                <h3 className="text-4xl font-serif font-bold text-white mb-6 group-hover:translate-x-2 transition-transform duration-700">
                    {category.name}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-8 line-clamp-2 opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700 delay-100">
                    {category.description || "Uncovering the hidden dimensions of this reality and the patterns that define it."}
                </p>
                <div className="flex items-center gap-3 text-white text-[11px] font-black uppercase tracking-[0.2em] translate-y-6 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200">
                    Explore Category <ArrowRight size={18} className="text-primary group-hover:translate-x-3 transition-transform" />
                </div>
            </div>
        </Link>
    );
}
