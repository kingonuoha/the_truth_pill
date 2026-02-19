"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, MailWarning } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const unsubscribe = useMutation(api.users.unsubscribe);
    const [status, setStatus] = useState<"loading" | "success" | "error" | "no-email">("loading");

    useEffect(() => {
        const performUnsubscribe = async () => {
            if (!email) {
                setStatus("no-email");
                return;
            }
            try {
                const result = await unsubscribe({ email });
                if (result.success) {
                    setStatus("success");
                } else {
                    setStatus("error");
                }
            } catch (error) {
                console.error("Unsubscribe error:", error);
                setStatus("error");
            }
        };

        performUnsubscribe();
    }, [email, unsubscribe]);

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md"
            >
                <Card className="p-8 bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-gradient-to-br from-sky-500 to-purple-600 rounded-2xl shadow-lg ring-1 ring-white/20">
                            <span className="text-white font-bold text-xl">TP</span>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">The Truth Pill</h1>

                    <div className="py-8">
                        {status === "loading" && (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-12 w-12 text-sky-500 animate-spin mb-4" />
                                <p className="text-slate-400">Processing your request...</p>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="flex flex-col items-center">
                                <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">Unsubscribed</h2>
                                <p className="text-slate-400 mb-6">
                                    You have been successfully removed from our weekly deep truth newsletter.
                                </p>
                                <Button asChild className="w-full bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-600 hover:to-purple-700">
                                    <Link href="/">Back to Home</Link>
                                </Button>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="flex flex-col items-center">
                                <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                    <XCircle className="h-10 w-10 text-red-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
                                <p className="text-slate-400 mb-6">
                                    We couldn&apos;t process your unsubscription automatically. Please try again or contact support.
                                </p>
                                <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => window.location.reload()}>
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {status === "no-email" && (
                            <div className="flex flex-col items-center">
                                <div className="h-16 w-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                                    <MailWarning className="h-10 w-10 text-amber-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">Missing Information</h2>
                                <p className="text-slate-400 mb-6">
                                    We need a valid email address to unsubscribe you.
                                </p>
                                <Button asChild variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                                    <Link href="/">Go to Home</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                        Changed your mind? You can always resubscribe from your profile settings or the newsletter section on our homepage.
                    </p>
                </Card>
            </motion.div>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-sky-500 animate-spin" />
            </div>
        }>
            <UnsubscribeContent />
        </Suspense>
    );
}
