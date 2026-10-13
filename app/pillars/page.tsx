import { nest } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { Search, Layers, ChevronRight } from "lucide-react";
import { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
    title: "Research Pillars | The Truth Pill",
    description: "Explore our core research pillars, each representing a primary dimension of human behavior and psychological reality.",
};

export default async function PillarsPage() {
    const pillars = (await nest.pillars()) || [];
    const categories = (await nest.categories()) || [];

    // Map category names to pillars for display
    const pillarsWithCategory = pillars.map(pillar => {
        const category = categories.find(c => c.id === pillar.categoryId);
        return {
            ...pillar,
            categoryName: category?.name || "Uncategorized"
        };
    });

    return (
        <main className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950">
            <Navbar solid />
            
            <div className="max-w-7xl mx-auto px-6 py-32">
                <div className="flex flex-col mb-16">
                    <div className="flex items-center gap-3 text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                        <Layers size={14} />
                        Research Pillars
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif font-black text-gray-950 dark:text-white mb-6">
                        Primary Dimensions
                    </h1>
                    <div className="h-1.5 w-24 bg-blue-600 rounded-full mb-8 shadow-lg shadow-blue-500/20" />
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
                        Navigate through our core ideological columns. Each pillar represents a fundamental area of research into the human condition.
                    </p>
                </div>

                {pillarsWithCategory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pillarsWithCategory.map((pillar) => (
                            <Link 
                                key={pillar.id}
                                href={`/pillars/${pillar.slug}`}
                                className="group relative p-10 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[48px] hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-700 flex flex-col justify-between h-[320px] overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                                    <Layers size={160} />
                                </div>

                                <div className="relative z-10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-4 block">
                                        {pillar.categoryName}
                                    </span>
                                    <h3 className="text-3xl font-serif font-bold text-gray-950 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {pillar.name}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 font-medium">
                                        {pillar.description || "Deep dive into this structural dimension of psychological reality."}
                                    </p>
                                </div>

                                <div className="relative z-10 flex items-center justify-between mt-8 pt-8 border-t border-gray-50 dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    Explore Pillar
                                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-2">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        title="No Pillars Formed" 
                        description="The architectural foundation of our research is currently being structured. Check back soon for our primary pillars."
                        illustration="Empty-folder.svg"
                        action={
                            <Link 
                                href="/"
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                            >
                                <Search size={14} />
                                Back to Home
                            </Link>
                        }
                    />
                )}

                {/* Linking to Categories */}
                <div className="mt-32 pt-20 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-3xl font-serif font-bold text-gray-950 dark:text-white mb-2 italic">Browse by Category</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">View our broader research taxonomies and core domains.</p>
                        </div>
                        <Link 
                            href="/category" 
                            className="group flex items-center gap-4 bg-gray-950 dark:bg-white dark:text-gray-950 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-xl active:scale-95"
                        >
                            View All Categories <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
