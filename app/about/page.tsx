"use client";

import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { BookOpen, Users, Compass, Shield } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen transition-colors duration-500">
            <Navbar solid />
            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl mb-20"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 dark:text-blue-400 mb-4 block">The Mission</span>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 italic text-gray-900 dark:text-white">Learn the Truth.</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-medium leading-relaxed">
                            The Truth Pill is a place where we learn why people do what they do.
                            We help you understand your own mind and the world around you in a simple way.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32">
                        <div className="space-y-12">
                            <Feature
                                icon={<BookOpen className="text-blue-600 dark:text-blue-400" />}
                                title="Learn Why"
                                description="We don't just tell you what happened. We help you understand why it happened."
                            />
                            <Feature
                                icon={<Users className="text-blue-600 dark:text-blue-400" />}
                                title="For Everyone"
                                description="We believe everyone should be able to understand how their brain works."
                            />
                        </div>
                        <div className="space-y-12">
                            <Feature
                                icon={<Compass className="text-blue-600 dark:text-blue-400" />}
                                title="Finding Your Way"
                                description="We give you tools and tips to help you stay calm and happy in a busy world."
                            />
                            <Feature
                                icon={<Shield className="text-blue-600 dark:text-blue-400" />}
                                title="Always Honest"
                                description="We always tell the truth, even if it's hard to hear. Honesty helps us grow."
                            />
                        </div>
                    </div>

                    <div className="bg-gray-950 dark:bg-blue-600 rounded-[64px] p-12 md:p-24 text-center text-white relative overflow-hidden transition-colors duration-500">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.1),transparent)]" />
                        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-8 relative z-10 italic">Start Your Journey</h2>
                        <p className="text-white/60 max-w-xl mx-auto mb-12 relative z-10 font-medium">
                            Join us today and start learning things that will help you for the rest of your life.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex gap-6 group">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 transition-all duration-300">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-serif font-black mb-2 text-gray-900 dark:text-white transition-colors">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed transition-colors">{description}</p>
            </div>
        </div>
    );
}
