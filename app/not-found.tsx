import Link from "next/link";
import { Ghost, Home, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6">
            <div className="max-w-xl w-full text-center">
                <div className="relative inline-block mb-12">
                    <div className="absolute inset-0 bg-sky-blue/20 blur-[60px] rounded-full" />
                    <Ghost size={120} className="text-zinc-900 relative animate-float" />
                </div>

                <h1 className="text-6xl md:text-8xl font-serif font-black text-zinc-900 mb-6 tracking-tighter">404</h1>
                <h2 className="text-2xl font-serif font-bold text-zinc-800 mb-4 italic">Dimension Uncharted</h2>
                <p className="text-zinc-500 font-medium mb-12 max-w-md mx-auto leading-relaxed">
                    The path you seek is currently outside our observable spectrum of truth. Perhaps it has shifted into a different plane of existence.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
                    <Link
                        href="/"
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-zinc-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-sky-blue hover:shadow-2xl hover:shadow-sky-blue/20 transition-all duration-300 active:scale-95"
                    >
                        <Home size={16} />
                        Return to Origin
                    </Link>
                    <Link
                        href="/search"
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:border-sky-blue transition-all duration-300 active:scale-95"
                    >
                        <Search size={16} />
                        Search Reality
                    </Link>
                </div>
            </div>
        </div>
    );
}
