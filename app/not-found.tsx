import Link from "next/link";
import Image from "next/image";
import { Home, Search, Compass } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -z-10 animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-100/10 blur-[120px] rounded-full -z-10 animate-pulse delay-1000" />

            <div className="max-w-2xl w-full text-center py-20">
                <div className="relative inline-block mb-10 group">
                    <div className="absolute inset-0 bg-blue-100/30 blur-[40px] rounded-full group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative">
                        <Image
                            src="/illustrations/Page-not-found.svg"
                            alt="404 Illustration"
                            width={320}
                            height={320}
                            className="mx-auto drop-shadow-2xl animate-float"
                            priority
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-8xl md:text-[120px] font-serif font-black text-gray-900 leading-none tracking-tighter opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-20 pointer-events-none">404</h1>

                    <div>
                        <h2 className="text-3xl md:text-4xl font-serif font-black text-gray-950 mb-3 tracking-tight italic flex items-center justify-center gap-3">
                            <Compass className="text-blue-600" size={32} />
                            Dimension Uncharted
                        </h2>
                        <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full mb-6" />
                        <p className="text-gray-500 font-medium text-lg max-w-lg mx-auto leading-relaxed">
                            The signal you&apos;re tracking has drifted into an unobservable spectrum of reality. The path may have shifted planes.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 items-center justify-center pt-8">
                        <Link
                            href="/"
                            className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-600/30 transition-all duration-300 active:scale-95 overflow-hidden"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Home size={16} className="relative z-10 group-hover:scale-110 transition-transform" />
                            <span className="relative z-10">Return to Origin</span>
                        </Link>
                        <Link
                            href="/search"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 transition-all duration-300 active:scale-95 hover:shadow-lg shadow-sm"
                        >
                            <Search size={16} />
                            Search Reality
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
