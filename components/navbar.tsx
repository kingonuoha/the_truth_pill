"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { setAuthRedirect } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { User, Search, LogIn, LogOut } from "lucide-react";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between",
                isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-3" : "bg-transparent"
            )}
        >
            <NavbarContent isScrolled={isScrolled} />
        </nav>
    );
}

function NavbarContent({ isScrolled }: { isScrolled: boolean }) {
    const { status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");

    return (
        <>
            <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">T</div>
                <span className={cn(
                    "font-serif text-2xl font-bold tracking-tight",
                    isScrolled ? "text-foreground" : "text-white"
                )}>
                    The Truth Pill
                </span>
            </Link>

            <div className={cn(
                "hidden md:flex items-center gap-8 font-black uppercase text-[10px] tracking-widest",
                isScrolled ? "text-foreground/80" : "text-white/90"
            )}>
                <Link href="/articles" className="hover:text-primary transition-colors">Articles</Link>
                <Link href="/categories" className="hover:text-primary transition-colors">Categories</Link>
                <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "p-2 rounded-full transition-colors",
                        isScrolled ? "hover:bg-zinc-100 text-foreground" : "hover:bg-white/10 text-white"
                    )}
                >
                    <Search size={20} />
                </button>

                {status === "authenticated" && (
                    <Link href="/profile">
                        <button className={cn(
                            "p-2 rounded-full transition-colors",
                            isScrolled ? "hover:bg-zinc-100 text-foreground" : "hover:bg-white/10 text-white"
                        )}>
                            <User size={20} />
                        </button>
                    </Link>
                )}

                <AuthButton isScrolled={isScrolled} />
            </div>

            {/* Search Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col p-6 md:p-20">
                    <div className="flex justify-between items-center mb-10">
                        <span className="font-serif text-3xl font-bold">Search the Truth</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-4 hover:bg-zinc-100 rounded-full transition-colors"
                        >
                            <div className="w-6 h-6 relative">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black rotate-45" />
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black -rotate-45" />
                            </div>
                        </button>
                    </div>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search keywords, topics, or insights..."
                        className="w-full text-4xl md:text-6xl font-serif font-bold border-b-2 border-zinc-100 focus:border-primary outline-none pb-4 transition-colors placeholder:text-zinc-200"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Popular Truths</h4>
                            <div className="space-y-4">
                                {["Shadow Self", "Deep Observation", "Resilience", "Mindfulness"].map(term => (
                                    <button key={term} className="block text-xl font-serif hover:text-primary transition-colors underline-offset-4 hover:underline">
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function AuthButton({ isScrolled }: { isScrolled: boolean }) {
    const { status } = useSession();
    const isAuthenticated = status === "authenticated";
    const router = useRouter();

    const handleAuth = () => {
        if (isAuthenticated) {
            signOut();
        } else {
            setAuthRedirect(window.location.pathname);
            router.push("/auth/signin");
        }
    };

    return (
        <button
            onClick={handleAuth}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm hover:scale-105 active:scale-95",
                isScrolled
                    ? "bg-primary text-white hover:shadow-lg"
                    : "bg-white text-primary hover:bg-zinc-100"
            )}
        >
            {status === "loading" ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isAuthenticated ? (
                <>
                    <LogOut size={14} />
                    <span>Logout</span>
                </>
            ) : (
                <>
                    <LogIn size={14} />
                    <span>Login</span>
                </>
            )}
        </button>
    );
}
