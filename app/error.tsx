"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { RefreshCw, Home, AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-600/5 blur-[120px] rounded-full -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-amber-100/10 blur-[120px] rounded-full -z-10 animate-pulse delay-700" />

            <div className="max-w-xl w-full text-center py-20">
                <div className="relative inline-block mb-10">
                    <div className="absolute inset-0 bg-rose-100/30 blur-[40px] rounded-full" />
                    <Image
                        src="/illustrations/Something-went-wrong.svg"
                        alt="Error Illustration"
                        width={300}
                        height={300}
                        className="mx-auto relative z-10 drop-shadow-xl"
                        priority
                    />
                </div>

                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-600 font-black text-[10px] uppercase tracking-widest mb-4">
                        <AlertCircle size={12} />
                        Anomalous Event Detected
                    </div>

                    <h1 className="text-4xl md:text-5xl font-serif font-black text-gray-950 mb-3 tracking-tight">System Disruption</h1>
                    <div className="h-1 w-16 bg-rose-500 mx-auto rounded-full mb-6" />
                    <p className="text-gray-500 font-medium text-lg max-w-sm mx-auto leading-relaxed">
                        The cognitive flow has been interrupted by an unexpected anomaly in current reality. Our collective is investigating.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 items-center justify-center pt-8">
                        <button
                            onClick={reset}
                            className="group w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-rose-600 hover:shadow-2xl hover:shadow-rose-600/30 transition-all duration-300 active:scale-95"
                        >
                            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                            Reconnect Reality
                        </button>
                        <Link
                            href="/"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-50 hover:border-gray-950 transition-all duration-300 active:scale-95 shadow-sm"
                        >
                            <Home size={16} />
                            Return to Source
                        </Link>
                    </div>
                </div>

                {process.env.NODE_ENV === "development" && (
                    <div className="mt-12 p-4 bg-gray-900 rounded-xl text-left overflow-auto max-h-40 border border-gray-800">
                        <p className="text-rose-400 font-mono text-xs mb-2">Error Log:</p>
                        <code className="text-gray-400 text-[10px] font-mono whitespace-pre">{error.message}</code>
                    </div>
                )}
            </div>
        </div>
    );
}
