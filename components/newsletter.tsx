"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function Newsletter() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const subscribe = useMutation(api.users.subscribeToNewsletter);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await subscribe({ email });
            setEmail("");
            toast.success("Welcome to the circle of truth.");
        } catch (error) {
            toast.error("Failed to subscribe. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="relative overflow-hidden bg-zinc-900 rounded-3xl p-6 md:p-10">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
                <div className="max-w-md text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-sky-blue text-[8px] font-black uppercase tracking-widest mb-3">
                        <Sparkles size={8} /> The Inner Circle
                    </div>

                    <h2 className="text-xl md:text-2xl font-serif font-bold text-white mb-2 leading-tight">
                        Deep truths, <span className="text-sky-blue italic">unfiltered.</span>
                    </h2>

                    <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                        Join 50,000+ seekers getting weekly insights that challenge conventional perception.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full max-w-sm">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-sky-blue transition-colors" size={16} />
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-28 text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-[11px]"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary text-white px-4 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-sky-400 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 size={10} className="animate-spin" /> : <>Join <ArrowRight size={10} /></>}
                        </button>
                    </div>
                    <p className="mt-2.5 text-[8px] text-zinc-500 font-medium uppercase tracking-widest text-center md:text-left opacity-60">
                        No fluff. Just value. Unsubscribe anytime.
                    </p>
                </form>
            </div>
        </section>
    );
}
