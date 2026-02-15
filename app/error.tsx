"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

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
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-24">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <AlertTriangle className="w-10 h-10 text-rose-600" />
                </div>
                <h1 className="text-4xl font-serif font-black text-zinc-900 mb-4 tracking-tight">System Disruption</h1>
                <p className="text-zinc-500 font-medium mb-10 leading-relaxed">
                    The cognitive flow has been interrupted by an unexpected anomaly in current reality.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-blue transition-all active:scale-95 shadow-xl shadow-zinc-900/10"
                    >
                        <RefreshCw size={14} />
                        Reconnect Reality
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-zinc-200 text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                    >
                        <Home size={14} />
                        Base Manifestation
                    </Link>
                </div>
            </div>
        </div>
    );
}
