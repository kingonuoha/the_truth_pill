"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, Lock, Hash } from "lucide-react";
import { toast } from "sonner";
import { sendOtpAction, verifyAndChangePasswordAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<"email" | "otp" | "success">("email");
    const [email, setEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");

    async function handleRequestOtp(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const emailInput = formData.get("email") as string;
        setEmail(emailInput);

        try {
            const result = await sendOtpAction(emailInput, "password_reset");
            if (result.success) {
                setStep("otp");
                toast.success("Verification code sent!", {
                    description: "Check your email for the 6-digit security code.",
                });
            } else {
                toast.error("Failed to send code", { description: result.message });
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);

        try {
            const result = await verifyAndChangePasswordAction(email, otpCode, "password_reset", formData);
            if (result.success) {
                setStep("success");
                toast.success("Password reset successful!", {
                    description: "You can now sign in with your new password.",
                });
            } else {
                toast.error("Reset failed", { description: result.message || result.error });
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 py-12">
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
                    <h1 className="text-4xl font-serif font-black text-gray-900 dark:text-white mb-3">
                        {step === "success" ? "All Set!" : "Secure Reset"}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {step === "email" && "Enter your email for identity verification"}
                        {step === "otp" && "Enter the 6-digit code sent to your email"}
                        {step === "success" && "Your identity has been successfully recalibrated"}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
                    <AnimatePresence mode="wait">
                        {step === "email" && (
                            <motion.form
                                key="email-step"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleRequestOtp}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                                    <div className="relative group/input">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-medium italic"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                                    Verify Identity
                                </button>

                                <Link
                                    href="/auth/signin"
                                    className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors pt-2"
                                >
                                    <ArrowLeft size={14} />
                                    Back to Login
                                </Link>
                            </motion.form>
                        )}

                        {step === "otp" && (
                            <motion.form
                                key="otp-step"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleResetPassword}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Verification Code</label>
                                        <div className="relative group/input">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                            <input
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                placeholder="000000"
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-black tracking-[0.5em] text-center"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">New Password</label>
                                        <div className="relative group/input">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                            <input
                                                name="password"
                                                type="password"
                                                placeholder="Min 8 characters"
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirm Password</label>
                                        <div className="relative group/input">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={18} />
                                            <input
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="Repeat password"
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-gray-900 dark:text-white font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || otpCode.length !== 6}
                                    className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                                    Recalibrate Identity
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep("email")}
                                    className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors pt-2"
                                >
                                    <ArrowLeft size={14} />
                                    Wait, use different email
                                </button>
                            </motion.form>
                        )}

                        {step === "success" && (
                            <motion.div
                                key="success-step"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-4"
                            >
                                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-blue-600/5 border border-blue-100 dark:border-blue-900/50">
                                    <CheckCircle2 className="w-12 h-12 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-serif font-black text-gray-900 dark:text-white mb-3">System Updated</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">
                                    Your secure credentials have been updated successfully. Proceed to the main portal.
                                </p>
                                <Link
                                    href="/auth/signin"
                                    className="inline-flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-950 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-400 transition-all active:scale-95 shadow-xl shadow-black/10"
                                >
                                    Enter Portal <ArrowLeft className="rotate-180" size={14} />
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
