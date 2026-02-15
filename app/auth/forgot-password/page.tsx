"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const requestReset = useAction(api.email_actions.requestPasswordReset);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;

        try {
            await requestReset({ email });
            setIsSent(true);
            toast.success("Reset link sent!", {
                description: "Check your email for instructions to reset your password.",
            });
        } catch (error: unknown) {
            const err = error as Error;
            toast.error("Process failed", {
                description: err.message || "Something went wrong. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">T</div>
                        <span className="font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">The Truth Pill</span>
                    </Link>
                    <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-2">Reset Password</h1>
                    <p className="text-zinc-500">
                        {isSent
                            ? "Instructions have been sent to your email"
                            : "Enter your email to receive a password reset link"
                        }
                    </p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100">
                    {isSent ? (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">Check Your Email</h3>
                            <p className="text-zinc-500 mb-8">
                                We&apos;ve sent a password reset link. It will expire in 1 hour.
                            </p>
                            <Link
                                href="/auth/signin"
                                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                            >
                                <ArrowLeft size={16} />
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-gradient py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                                Send Reset Link
                            </button>

                            <Link
                                href="/auth/signin"
                                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors pt-2"
                            >
                                <ArrowLeft size={16} />
                                Back to Sign In
                            </Link>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
