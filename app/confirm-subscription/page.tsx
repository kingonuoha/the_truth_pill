"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function ConfirmSubscriptionContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const confirm = useMutation(api.users.confirmNewsletter);
    const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");

    useEffect(() => {
        const performConfirmation = async () => {
            if (!token) {
                setStatus("no-token");
                return;
            }
            try {
                const result = await confirm({ token });
                if (result.success) {
                    setStatus("success");
                } else {
                    setStatus("error");
                }
            } catch (error) {
                console.error("Confirmation error:", error);
                setStatus("error");
            }
        };

        performConfirmation();
    }, [token, confirm]);

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden text-center">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-sky-400/20 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md"
            >
                <Card className="p-10 bg-slate-900/60 border-slate-800 backdrop-blur-2xl shadow-[0_0_50px_rgba(14,165,233,0.1)] border-t-sky-500/50">
                    <div className="flex justify-center mb-8">
                        <div className="h-20 w-20 bg-gradient-to-tr from-sky-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                            <Sparkles className="h-10 w-10 text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent mb-2">The Truth Pill</h1>

                    <div className="py-6">
                        {status === "loading" && (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-12 w-12 text-sky-400 animate-spin mb-4" />
                                <p className="text-slate-300 font-medium tracking-wide">Validating your token...</p>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="flex flex-col items-center">
                                <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/10">
                                    <CheckCircle2 className="h-10 w-10 text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-3">You&apos;re in!</h2>
                                <p className="text-slate-400 mb-8 leading-relaxed">
                                    Your subscription is confirmed. Prepare yourself for deep truths and psychological insights delivered to your inbox every Monday.
                                </p>
                                <Button asChild size="lg" className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold tracking-wide shadow-lg shadow-sky-500/20">
                                    <Link href="/">Enter The Truth Pill</Link>
                                </Button>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="flex flex-col items-center">
                                <XCircle className="h-16 w-16 text-red-500 mb-6" />
                                <h2 className="text-xl font-bold text-white mb-2">Invalid Token</h2>
                                <p className="text-slate-400 mb-8">
                                    This confirmation link is invalid or has already been used. Please try subscribing again.
                                </p>
                                <Button asChild variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                                    <Link href="/">Back to Home</Link>
                                </Button>
                            </div>
                        )}

                        {status === "no-token" && (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-12 w-12 text-slate-700 mb-6" />
                                <h2 className="text-xl font-bold text-white mb-2">Waiting for token...</h2>
                                <p className="text-slate-400 mb-8">
                                    Please check your email for the confirmation link.
                                </p>
                                <Button asChild variant="ghost" className="text-sky-400 hover:text-sky-300 hover:bg-sky-500/10">
                                    <Link href="/">Return Home</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}

export default function ConfirmSubscriptionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-sky-400 animate-spin" />
            </div>
        }>
            <ConfirmSubscriptionContent />
        </Suspense>
    );
}
