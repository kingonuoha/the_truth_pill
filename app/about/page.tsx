"use client";

import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { BookOpen, Users, Compass, Shield } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="bg-white min-h-screen">
            <Navbar solid />
            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl mb-20"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">The Mission</span>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 italic">Truth over Comfort.</h1>
                        <p className="text-zinc-500 text-lg md:text-xl font-medium leading-relaxed">
                            The Truth Pill is more than a blog. It is a digital laboratory for the human condition,
                            where we dissect behavior, cultural patterns, and the psyche through an unfiltered lens.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32">
                        <div className="space-y-12">
                            <Feature
                                icon={<BookOpen className="text-primary" />}
                                title="Deep Inquiry"
                                description="We don't settle for surface-level explanations. Our articles go deep into the 'why' behind human actions."
                            />
                            <Feature
                                icon={<Users className="text-primary" />}
                                title="Human Centered"
                                description="Everything we do is about the individual's experience in an increasingly complex and noisy world."
                            />
                        </div>
                        <div className="space-y-12">
                            <Feature
                                icon={<Compass className="text-primary" />}
                                title="Reality Nav"
                                description="Providing the tools and insights needed to navigate modern life with clarity and self-awareness."
                            />
                            <Feature
                                icon={<Shield className="text-primary" />}
                                title="Unfiltered"
                                description="We value the truth above all, even when it's uncomfortable. Our reviews represent genuine observation."
                            />
                        </div>
                    </div>

                    <div className="bg-zinc-900 rounded-[64px] p-12 md:p-24 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.1),transparent)]" />
                        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-8 relative z-10">Join the Enlightenment</h2>
                        <p className="text-white/60 max-w-xl mx-auto mb-12 relative z-10 font-medium">
                            Step into the archive and start your journey toward radical self-honesty and psychological clarity.
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
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold mb-2">{title}</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
