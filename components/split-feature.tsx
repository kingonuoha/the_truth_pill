import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Target } from "lucide-react";

export function SplitFeature() {
    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-900/30 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        <span className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4 block">
                            Why The Truth Pill?
                        </span>
                        <h2 className="text-4xl md:text-5xl font-serif font-black text-gray-900 dark:text-white mb-8 leading-tight">
                            We provide the tools to <span className="italic">decipher</span> reality.
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 leading-relaxed">
                            In an era of noise and superficiality, we offer deep, evidence-based insights into the mechanics of the mind and society.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center shrink-0">
                                    <Shield className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Authentic Bias</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Pure, unfiltered data from leading psychologists.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center shrink-0">
                                    <Zap className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Actionable Wisdom</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Not just theory, but frameworks for daily growth.</p>
                                </div>
                            </div>
                        </div>

                        <Link
                            href="/about"
                            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest group"
                        >
                            Learn about our methodology
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="order-1 lg:order-2 relative">
                        <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl z-10">
                            <Image
                                src="https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1200"
                                alt="Human Mind"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay" />
                        </div>
                        {/* Decortative elements */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -z-10" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-[80px] -z-10" />

                        <div className="absolute bottom-8 -left-8 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl z-20 max-w-[200px] border border-gray-100 dark:border-gray-700 hidden sm:block">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="text-blue-600" size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Focus Index</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white font-serif">98.4%</div>
                            <div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full w-[98%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
