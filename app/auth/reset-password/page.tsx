"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { resetPasswordAction } from "@/app/actions/auth";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 py-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -mr-64 -mt-64" />
                <div className="text-center max-w-md w-full relative z-10">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-red-500/5">
                        <AlertCircle size={32} />
                    </div>
                    <h1 className="text-3xl font-serif font-black text-gray-900 dark:text-white mb-3">Invalid Link</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">This password reset link is invalid or has expired.</p>
                    <Link
                        href="/auth/forgot-password"
                        className="bg-blue-600 hover:bg-blue-700 px-10 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] inline-block shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
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
                    <h1 className="text-4xl font-serif font-black text-gray-900 dark:text-white mb-3">New Password</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Set a secure password for your account</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
                    {isSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-blue-600/5">
                                <CheckCircle2 className="w-12 h-12 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-serif font-black text-gray-900 dark:text-white mb-3">Password Updated</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">
                                Your password has been successfully reset.
                            </p>
                            <Link
                                href="/auth/signin"
                                className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                            >
                                Sign In Now
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">New Password</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                        className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirm New Password</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                    <input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                        className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-bold uppercase tracking-widest text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                                Reset Password
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
