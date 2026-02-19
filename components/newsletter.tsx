"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
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
            const result = (await subscribe({ email })) as { status: string };
            setEmail("");

            if (result.status === "invited") {
                toast.success("Invitation sent!", {
                    description: "Check your email to confirm your subscription and create your account.",
                });
            } else {
                toast.success("Welcome to the circle of truth.", {
                    description: "You've been successfully subscribed to our newsletter.",
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Subscription failed", {
                description: "Failed to process your subscription. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="relative overflow-hidden bg-gray-900 rounded-[3rem] p-8 md:p-16 border border-gray-800 group">
            {/* Background Image with Fade */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=2070&auto=format&fit=crop"
                    alt="Background"
                    fill
                    className="object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="max-w-md text-center lg:text-left">
                    <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">
                        The Weekly Pulse
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif font-black text-white mb-4 leading-tight">
                        Deep truths, <span className="italic text-blue-400">delivered.</span>
                    </h2>
                    <p className="text-gray-400 font-medium leading-relaxed">
                        Join 50,000+ seekers getting weekly insights that challenge conventional perception.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full max-w-md">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-grow group/input">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-blue-400 transition-colors" size={18} />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-600/20 active:scale-95 whitespace-nowrap"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Join Circle <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center lg:text-left opacity-60">
                        No fluff. Just value. Unsubscribe anytime.
                    </p>
                </form>
            </div>
        </section>
    );
}
