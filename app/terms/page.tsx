"use client";

import { motion } from "framer-motion";
import { Shield, Lock, FileText, Scale } from "lucide-react";

export default function TermsPage() {
    const sections = [
        {
            icon: Scale,
            title: "Intellectual Sovereignty",
            content: "All content produced by The Truth Pill, whether human or AI-assisted, is the property of the network. We grant you a limited frequency license to consume and reflect upon these truths for personal evolution."
        },
        {
            icon: Shield,
            title: "Truth Integrity",
            content: "While we strive for absolute psychological precision, human experience is subjective. We are not responsible for the existential crises or profound realizations that may occur upon consuming our content."
        },
        {
            icon: Lock,
            title: "Privacy Paradigm",
            content: "Your data is your own. We only track signals to improve the collective flow of information. We do not sell your soul or your email to third-party entities."
        },
        {
            icon: FileText,
            title: "The Social Contract",
            content: "By accessing this platform, you agree to engage in civil discourse. Hostility is a low-vibration signal and may result in a temporary disconnection from the network."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-background-950 pt-32 pb-20 px-6 transition-colors duration-500">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-school-purple mb-4">The Framework</h4>
                    <h1 className="text-6xl font-serif font-black text-zinc-900 dark:text-white mb-6 italic tracking-tight">
                        Terms of <span className="text-sky-blue">Wisdom</span>.
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-serif italic text-lg">
                        Last calibrated: February 2026
                    </p>
                </motion.div>

                <div className="space-y-12">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-zinc-50 dark:bg-background-900/50 p-8 rounded-[32px] border border-zinc-100 dark:border-zinc-800/50"
                        >
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-cardshadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0 text-sky-blue">
                                    <section.icon size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-black text-zinc-900 dark:text-white mb-3 italic">{section.title}</h2>
                                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-serif italic">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 p-8 border-t border-zinc-100 dark:border-zinc-800 text-center"
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Evolution requires consensus. By continuing, you agree to grow.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
