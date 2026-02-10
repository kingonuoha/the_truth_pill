"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Chrome, Loader2 } from "lucide-react";
import { loginUser } from "@/app/actions/auth";

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const result = await loginUser(formData);

        if (result?.error) {
            setError(result.error);
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
                    <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-2">Welcome Back</h1>
                    <p className="text-zinc-500">Sign in to your account to continue</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100">
                    <form onSubmit={handleSubmit} className="space-y-5">
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

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-semibold text-zinc-700">Password</label>
                                <Link href="/auth/forgot-password" title="Forgot password" className="text-xs font-bold text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
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
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                            Sign In
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 text-zinc-400 font-bold tracking-widest">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setIsGoogleLoading(true);
                            signIn("google", { callbackUrl: "/" });
                        }}
                        disabled={isGoogleLoading}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-zinc-200 rounded-xl text-zinc-700 font-bold hover:bg-zinc-50 transition-all disabled:opacity-70"
                    >
                        {isGoogleLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : <Chrome className="text-[#4285F4]" size={20} />}
                        Google
                    </button>
                </div>

                <p className="mt-8 text-center text-zinc-500 text-sm font-medium">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/signup" className="text-primary font-bold hover:underline">
                        Create one now
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
