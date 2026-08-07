
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { Clock, ArrowRight, Brain, Lightbulb, Compass, Layers } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { Metadata } from "next";
import { JoinedArticle } from "@/components/blog-grid";
import { getCanonical } from "@/lib/site-url";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const pillar = await fetchQuery(api.pillars.getBySlug, { slug });
    return {
        title: pillar?.name || "Pillar",
        description: pillar?.description || "Exploring the deep psychological dimensions of this research pillar.",
        alternates: {
            canonical: getCanonical(`pillars/${slug}`),
        },
    };
}

export default async function PillarPage({ 
    params,
    searchParams 
}: { 
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ type?: string }>
}) {
    const { slug } = await params;
    const { type } = await searchParams;
    const pillar = await fetchQuery(api.pillars.getBySlug, { slug });
    
    if (!pillar) {
        return (
            <main className="min-h-screen bg-background">
                <Navbar solid />
                <div className="pt-40 px-6 text-center">
                    <h1 className="text-4xl font-serif font-bold mb-4">Pillar Not Found</h1>
                    <Link href="/topics" className="text-blue-600 hover:underline">Back to Pillars Directory</Link>
                </div>
            </main>
        );
    }

    const typeFilter = type || undefined;
    const listResult = await fetchQuery(api.articles.list, { 
        pillar: pillar.slug,
        type: typeFilter,
        paginationOpts: { numItems: 50, cursor: null }
    });
    const articles = listResult?.page || [];

    const postTypes = [
        { label: "All Insights", value: "", icon: <Compass size={14} /> },
        { label: "Pillar Posts", value: "pillar", icon: <Brain size={14} /> },
        { label: "Cluster Posts", value: "cluster", icon: <Layers size={14} /> },
        { label: "Micro Posts", value: "micro", icon: <Lightbulb size={14} /> },
        { label: "Insight Pages", value: "insight", icon: <Brain size={14} /> },
        { label: "Observant", value: "observant", icon: <Compass size={14} /> },
    ];

    return (
        <main className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950">
            <Navbar solid />
            
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                {/* Hero section */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-6">
                        <span className="w-10 h-[1px] bg-blue-600/30" />
                        Research Pillar
                    </div>
                    <h1 className="text-5xl md:text-8xl font-serif font-black text-gray-950 dark:text-white mb-8">
                        {pillar.name}
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-3xl font-medium leading-relaxed mb-12">
                        {pillar.description || "Uncovering the structural patterns and psychological dynamics that define this dimension of reality."}
                    </p>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {postTypes.map((type) => (
                            <Link
                                key={type.label}
                                href={`/pillars/${pillar.slug}${type.value ? `?type=${type.value}` : ''}`}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border",
                                    (typeFilter || "") === type.value
                                        ? "bg-blue-600 text-white border-blue-600 shadow-blue-500/20"
                                        : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:border-blue-600 dark:hover:border-blue-500"
                                )}
                            >
                                {type.icon}
                                {type.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article: JoinedArticle) => (
                            <ArticleCard key={article._id} article={article} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[64px]">
                        <EmptyState 
                            title="No Articles Found" 
                            description={`We haven't published any ${typeFilter ? typeFilter : ''} articles in the ${pillar.name} pillar yet. Check back soon for fresh insights.`}
                            illustration="Searching.svg"
                            action={
                                <Link 
                                    href="/category"
                                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-xl active:scale-95"
                                >
                                    Explore Other Pillars
                                </Link>
                            }
                        />
                    </div>
                )}
            </div>
        </main>
    );
}

function ArticleCard({ article }: { article: JoinedArticle }) {
    return (
        <Link 
            href={`/${article.slug}`}
            className="group flex flex-col bg-white dark:bg-gray-900 rounded-[48px] overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-700 h-full"
        >
            <div className="relative h-64 overflow-hidden">
                <Image 
                    src={article.coverImage || ""} 
                    alt={article.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                />
                <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                    <span className="px-4 py-1.5 bg-white/95 dark:bg-gray-900/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-blue-600">
                        {article.type || "Insight"}
                    </span>
                </div>
            </div>
            
            <div className="p-10 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full overflow-hidden relative border border-gray-100 dark:border-gray-800">
                        <Image 
                            src={article.authorImage || "/truthpill/logo-pill.png"} 
                            alt={article.authorName || "Author"} 
                            fill 
                            className="object-cover"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {article.authorName}
                    </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-gray-950 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                </h3>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 line-clamp-3 leading-relaxed font-medium">
                    {article.excerpt}
                </p>

                <div className="mt-auto pt-8 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-blue-600" /> {article.readingTime}m read</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-2">
                        <ArrowRight size={18} />
                    </div>
                </div>
            </div>
        </Link>
    );
}
