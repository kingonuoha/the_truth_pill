"use client";

import { Mail, Send, MessageSquare } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ContactPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success("Message channeled", {
            description: "Your signal has been received. We will decode and respond shortly.",
        });
        setName("");
        setEmail("");
        setMessage("");
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-background-950 pt-32 pb-20 px-6 transition-colors duration-500">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-20">
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-blue mb-4">Direct Channel</h4>
                            <h1 className="text-6xl font-serif font-black text-zinc-900 dark:text-white mb-8 italic tracking-tight">
                                Reach <span className="text-school-purple">The Source</span>.
                            </h1>
                            <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-12 leading-relaxed font-serif italic max-w-lg">
                                Have a discovery to share? A mystery to solve? Or just want to bridge the gap? Our frequency is open.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-cardflex items-center justify-center border border-zinc-100 dark:border-zinc-800 group-hover:bg-sky-blue group-hover:text-white transition-all duration-500">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Electronic Mail</p>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-white">connect@thetruthpill.com</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-cardflex items-center justify-center border border-zinc-100 dark:border-zinc-800 group-hover:bg-school-purple group-hover:text-white transition-all duration-500">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Encoded Frequency</p>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-white">@truthpill_hq</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-50 dark:bg-background-900/50 p-10 rounded-[40px] border border-zinc-100 dark:border-zinc-800/50 backdrop-blur-sm"
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Identity</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            required
                                            className="w-full bg-white dark:bg-background-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-sky-blue/50 transition-all font-medium text-zinc-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Coordinate</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Your email"
                                            required
                                            className="w-full bg-white dark:bg-background-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-sky-blue/50 transition-all font-medium text-zinc-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">The Signal</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="What truths shall we explore?"
                                        required
                                        rows={6}
                                        className="w-full bg-white dark:bg-background-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 outline-none focus:ring-2 focus:ring-sky-blue/50 transition-all font-medium text-zinc-900 dark:text-white resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-sky-blue dark:hover:bg-sky-blue hover:text-white transition-all duration-500 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Transmitting..." : (
                                        <>Initiate Connection <Send size={14} /></>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
