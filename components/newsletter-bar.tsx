"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useSession } from "next-auth/react";

export function NewsletterBar() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const { data: session } = useSession();

    // Check if user is already subscribed
    const user = useQuery(api.users.getMe);
    const subscribe = useMutation(api.users.subscribeToNewsletter);

    useEffect(() => {
        const dismissed = localStorage.getItem("tp_newsletter_dismissed");
        if (!dismissed && !user?.newsletterSubscribed) {
            const timer = setTimeout(() => setIsVisible(true), 5000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("tp_newsletter_dismissed", "true");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            await subscribe({ email });
            setStatus('success');
            setTimeout(() => setIsVisible(false), 3000);
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
                >
                    <div className="max-w-4xl mx-auto glass-card bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-blue to-school-purple" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1">
                                <h3 className="text-xl md:text-2xl font-serif font-bold text-zinc-900 mb-2">
                                    Get Weekly Insights
                                </h3>
                                <p className="text-zinc-500 text-sm md:text-base font-light">
                                    The deep truths, delivered straight to your inbox every Monday.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-blue/20 transition-all min-w-[280px]"
                                    required
                                    disabled={status === 'loading' || status === 'success'}
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="btn-gradient flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px]"
                                >
                                    {status === 'loading' ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : status === 'success' ? (
                                        <>
                                            <CheckCircle2 size={20} />
                                            Subscribed
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Join Now
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
