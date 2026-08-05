
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { Clock, ArrowRight, Tag as TagIcon } from "lucide-react";
import Image from "next/image";
import { EmptyState } from "@/components/empty-state";
import { Metadata } from "next";
import { JoinedArticle } from "@/components/blog-grid";
import { getCanonical } from "@/lib/site-url";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    return {
        title: `Tag: ${slug.split('-').join(' ')}`,
        description: `Explore all articles tagged with ${slug.split('-').join(' ')}.`,
        alternates: {
            canonical: getCanonical(`tags/${slug}`),
        },
    };
}

export default async function TagPage({ 
    params,
}: { 
    params: Promise<{ slug: string }>,
}) {
    const { slug } = await params;
    const displayTag = slug.split('-').join(' ');
    
    const articles = await fetchQuery(api.articles.listByTag, { tag: displayTag }) || [];

    return (
        <main className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950">
            <Navbar solid />
            
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                {/* Hero section */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-6">
                        <TagIcon size={14} />
                        Topic Tag
                    </div>
                    <h1 className="text-5xl md:text-8xl font-serif font-black text-gray-950 dark:text-white mb-8 capitalize italic">
                        #{displayTag}
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-3xl font-medium leading-relaxed">
                        Curated collection of insights and research specifically labeled under the <span className="text-gray-950 dark:text-white font-bold">{displayTag}</span> taxonomy.
                    </p>
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
                            title="No Tagged Content" 
                            description={`We haven't categorized any articles with the "#${displayTag}" tag just yet. Explore our main research pillars instead.`}
                            illustration="Searching.svg"
                            action={
                                <Link 
                                    href="/category"
                                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-xl active:scale-95"
                                >
                                    Explore Pillars
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
                    src={article.coverImage || "/truthpill/placeholder-image.png"} // Provide a fallback image
                    alt={article.title || "Article cover image"} // Ensure alt text is always present
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
