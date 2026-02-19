"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, Chrome, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerUser } from "@/app/actions/auth";
import { useEffect } from "react";

export default function SignUpPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            toast("You are already authenticated", {
                description: "Logout first if you wish to create a different identity.",
                icon: <AlertCircle size={16} />,
            });
            const role = session.user.role;
            router.replace(role === "admin" ? "/admin" : "/dashboard");
        }
    }, [status, session, router]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            toast.error("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const result = await registerUser(formData);

            if (result?.error) {
                setError(result.error);
                toast.error("Registration failed", {
                    description: result.error,
                });
                setIsLoading(false);
            } else {
                toast.success("Account created!", {
                    description: "Welcome to The Truth Pill circle.",
                });
                router.push("/");
                router.refresh();
            }
        } catch {
            setError("An unexpected error occurred");
            toast.error("Error", {
                description: "Something went wrong. Please try again.",
            });
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
                    <h1 className="text-4xl font-serif font-black text-gray-900 dark:text-white mb-3">Create Account</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Join our community of truth-seekers today.</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                            <div className="relative group/input">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-medium"
                                />
                            </div>
                        </div>

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

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirm Password</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-medium"
                                    />
                                </div>
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
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                            Create My Account
                        </button>
                    </form>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-white dark:bg-gray-900 px-4 text-gray-400 font-black tracking-[0.2em]">Or use magic</span>
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            setIsGoogleLoading(true);
                            try {
                                await signIn("google", { callbackUrl: "/" });
                            } catch {
                                setIsGoogleLoading(false);
                                toast.error("Google sign in failed");
                            }
                        }}
                        disabled={isGoogleLoading}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {isGoogleLoading ? <Loader2 className="animate-spin text-blue-600" size={18} /> : <Chrome size={18} className="text-gray-400" />}
                        Google Account
                    </button>
                </div>

                <p className="mt-10 text-center text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    Already have an account?{" "}
                    <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 ml-1">
                        Sign in instead
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
