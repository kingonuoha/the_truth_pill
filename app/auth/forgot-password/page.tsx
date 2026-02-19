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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 py-12">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -ml-64 -mb-64" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-600/20 transition-transform group-hover:scale-105">T</div>
                        <span className="font-serif text-3xl font-black text-gray-900 dark:text-white tracking-tight">The Truth Pill</span>
                    </Link>
                    <h1 className="text-4xl font-serif font-black text-gray-900 dark:text-white mb-3">Reset Password</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {isSent
                            ? "Instructions have been sent to your email"
                            : "Enter your email to receive a password reset link"
                        }
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
                    {isSent ? (
                        <div className="text-center py-4">
                            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-blue-600/5">
                                <CheckCircle2 className="w-12 h-12 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-serif font-black text-gray-900 dark:text-white mb-3">Check Your Email</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">
                                We&apos;ve sent a password reset link. It will expire in 1 hour.
                            </p>
                            <Link
                                href="/auth/signin"
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                                <div className="relative group/input">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-medium"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                                Send Reset Link
                            </button>

                            <Link
                                href="/auth/signin"
                                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors pt-2"
                            >
                                <ArrowLeft size={14} />
                                Back to Sign In
                            </Link>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
