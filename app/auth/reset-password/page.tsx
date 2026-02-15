"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { resetPasswordAction } from "@/app/actions/auth";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!token) {
            setError("Missing reset token");
            return;
        }

        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);

        try {
            const result = await resetPasswordAction(token, formData);

            if (result.success) {
                setIsSuccess(true);
                toast.success("Password reset successful!", {
                    description: "You can now sign in with your new password.",
                });
            } else {
                setError(result.error || "Failed to reset password");
                toast.error("Reset failed", {
                    description: result.error,
                });
            }
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "An unexpected error occurred");
            toast.error("Error", {
                description: "Something went wrong. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6 py-12">
                <div className="text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-zinc-900 mb-2">Invalid Request</h1>
                    <p className="text-zinc-500 mb-8">This password reset link is invalid or has expired.</p>
                    <Link
                        href="/auth/forgot-password"
                        className="btn-gradient px-8 py-3 rounded-xl text-white font-bold inline-block shadow-lg shadow-primary/20"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
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
                    <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-2">New Password</h1>
                    <p className="text-zinc-500">Set a secure password for your account</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100">
                    {isSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">Password Updated</h3>
                            <p className="text-zinc-500 mb-8">
                                Your password has been successfully reset.
                            </p>
                            <Link
                                href="/auth/signin"
                                className="w-full btn-gradient py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                            >
                                Sign In Now
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 ml-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 ml-1">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg font-medium">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-gradient py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                                Reset Password
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
