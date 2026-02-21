"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { cn, getAvatarUrl } from "@/lib/utils";
import { setAuthRedirect } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { User, Search, LogIn, LogOut, ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

interface NavbarProps {
    solid?: boolean;
    theme?: "light" | "dark";
}

export function Navbar({ solid = false, theme }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 flex items-center px-6 md:px-10 border-b",
                isScrolled || solid || theme === "dark"
                    ? "bg-white/95 dark:bg-gray-950/90 backdrop-blur-md border-gray-200 dark:border-gray-800 shadow-sm"
                    : "bg-transparent border-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                <NavbarContent isScrolled={isScrolled || solid || theme === "dark"} />
            </div>
        </nav>
    );
}

function NavbarContent({ isScrolled }: { isScrolled: boolean }) {
    const { data: session, status } = useSession();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [query, setQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Body Scroll Lock
    useEffect(() => {
        if (isSearchOpen || isMenuOpen) {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        };
    }, [isSearchOpen, isMenuOpen]);

    const isAuthenticated = status === "authenticated";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut({ redirect: false });
            toast.success("Successfully logged out", {
                description: "We hope to see you back soon.",
            });
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Logout failed", {
                description: "We couldn't log you out. Please try again later.",
            });
        }
        setIsProfileOpen(false);
        router.push("/");
    };

    const searchResults = useQuery(api.articles.search, { query: query.length > 2 ? query : "" });

    return (
        <>
            <div className="flex items-center gap-8">
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={cn(
                        "md:hidden p-2 rounded-xl transition-all active:scale-95",
                        isScrolled ? "text-zinc-900 bg-zinc-100" : "text-white bg-white/10 backdrop-blur-md"
                    )}
                >
                    <Menu size={24} />
                </button>

                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                        T
                    </div>
                    <span className={cn(
                        "font-serif text-xl font-bold tracking-tight transition-colors duration-300",
                        isScrolled ? "text-gray-900 dark:text-gray-100" : "text-white"
                    )}>
                        The Truth Pill
                    </span>
                </Link>
            </div>

            <div className={cn(
                "hidden md:flex items-center gap-8 text-sm font-medium transition-colors duration-300",
                isScrolled ? "text-gray-600 dark:text-gray-400" : "text-white/90"
            )}>
                <Link href="/articles" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Articles</Link>
                <Link href="/categories" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Categories</Link>
                <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className={cn(
                        "p-2 rounded-full transition-all active:scale-95",
                        isScrolled ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100" : "hover:bg-white/10 text-white"
                    )}
                >
                    <Search size={20} />
                </button>

                <ThemeToggle isScrolled={isScrolled} />

                <div className="hidden md:block">
                    {status === "loading" ? (
                        <div className="w-10 h-10 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : isAuthenticated ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={cn(
                                    "flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full transition-all active:scale-95 border-2 shadow-sm",
                                    isScrolled
                                        ? "bg-white border-zinc-100 hover:border-primary/20"
                                        : "bg-white/10 backdrop-blur-md border-white/20 hover:border-white/40"
                                )}
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-200 relative">
                                    <Image
                                        src={getAvatarUrl(session?.user?.name || "User", session?.user?.image || undefined)}
                                        alt={session?.user?.name || "User"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex flex-col items-start leading-none">
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-tighter max-w-[80px] truncate",
                                        isScrolled ? "text-zinc-900" : "text-white"
                                    )}>
                                        {session?.user?.name?.split(' ')[0]}
                                    </span>
                                    <span className="text-[8px] text-primary font-bold uppercase tracking-widest mt-0.5">Member</span>
                                </div>
                                <ChevronDown size={14} className={cn(
                                    "transition-transform duration-300",
                                    isProfileOpen ? "rotate-180" : "",
                                    isScrolled ? "text-zinc-400" : "text-white/60"
                                )} />
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-4 w-64 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl shadow-zinc-200/80 dark:shadow-black/50 border border-zinc-100 dark:border-zinc-800 overflow-hidden py-3 p-2 z-[60]"
                                    >
                                        <div className="px-4 py-3 border-b border-zinc-50 dark:border-zinc-800 mb-2">
                                            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Signed in as</p>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{session?.user?.email}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <Link
                                                href={session?.user?.role === "admin" ? "/admin" : "/dashboard"}
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-blue-500/10 flex items-center justify-center text-primary dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                    <User size={16} />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-widest">
                                                    {session?.user?.role === "admin" ? "Admin Panel" : "Dashboard"}
                                                </span>
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-red-100/50 dark:bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                                    <LogOut size={16} />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setAuthRedirect(window.location.pathname);
                                router.push("/auth/signin");
                            }}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-xs transition-all shadow-sm active:scale-95",
                                isScrolled
                                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
                                    : "bg-white text-gray-900 hover:bg-gray-100"
                            )}
                        >
                            Get Started
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 z-[110] bg-zinc-900/60 backdrop-blur-sm md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 z-[120] w-[85%] max-w-sm bg-white dark:bg-zinc-900 shadow-2xl md:hidden overflow-y-auto"
                        >
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                            T
                                        </div>
                                        <span className="font-serif text-xl font-bold dark:text-white">The Truth Pill</span>
                                    </div>
                                    <button
                                        onClick={() => setIsMenuOpen(false)}
                                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all dark:text-zinc-400"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {isAuthenticated && (
                                    <div className="mb-10 p-5 rounded-[32px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden relative border-2 border-white shadow-sm">
                                                <Image
                                                    src={getAvatarUrl(session?.user?.name || "User", session?.user?.image || undefined)}
                                                    alt="User"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white">{session?.user?.name}</h3>
                                                <p className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">Premium Member</p>
                                            </div>
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 hover:border-blue-600 transition-all group"
                                        >
                                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Access Dashboard</span>
                                            <ArrowRight size={16} className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                )}

                                <div className="space-y-2 mb-10">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4 px-2">Navigation</h4>
                                    {[
                                        { label: "Home", href: "/" },
                                        { label: "Articles", href: "/articles" },
                                        { label: "Categories", href: "/categories" },
                                        { label: "About Us", href: "/about" }
                                    ].map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center justify-between p-4 rounded-2xl text-zinc-900 dark:text-white hover:bg-blue-600 hover:text-white transition-all group"
                                        >
                                            <span className="text-lg font-serif font-bold">{item.label}</span>
                                            <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </Link>
                                    ))}
                                </div>

                                <div className="mt-auto pt-10 border-t border-zinc-100">
                                    {!isAuthenticated ? (
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                router.push("/auth/signin");
                                            }}
                                            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <LogIn size={18} />
                                            Login / Get Started
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="w-full py-4 bg-zinc-50 text-red-500 border border-red-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <LogOut size={18} />
                                            Sign Out
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Search Overlay */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col p-6 md:p-20 overflow-y-auto transition-colors duration-500"
                        style={{ height: '100vh', top: 0 }}
                    >
                        <div className="flex justify-between items-center mb-16">
                            <span className="font-serif text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white">Search Insights</span>
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="p-4 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all group active:scale-90"
                            >
                                <div className="w-8 h-8 relative">
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black dark:bg-white rotate-45 group-hover:bg-blue-600 transition-colors" />
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black dark:bg-white -rotate-45 group-hover:bg-blue-600 transition-colors" />
                                </div>
                            </button>
                        </div>
                        <div className="max-w-4xl mx-auto w-full">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search keywords..."
                                className="w-full text-4xl md:text-7xl font-serif font-bold border-b-2 border-zinc-100 dark:border-zinc-800 bg-transparent focus:border-blue-600 outline-none pb-8 transition-all duration-500 placeholder:text-zinc-200 dark:placeholder:text-zinc-800 text-zinc-900 dark:text-white"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />

                            {/* Search Results Preview */}
                            <div className="mt-12">
                                {query.length > 2 && searchResults?.length === 0 && (
                                    <p className="text-zinc-400 font-medium">No results found for &quot;{query}&quot;</p>
                                )}
                                <div className="grid grid-cols-1 gap-4">
                                    {searchResults?.map((article: Doc<"articles">) => (
                                        <Link
                                            key={article._id}
                                            href={`/articles/${article.slug}`}
                                            onClick={() => setIsSearchOpen(false)}
                                            className="group flex items-center gap-6 p-4 rounded-3xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
                                        >
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden relative flex-shrink-0">
                                                <Image src={article.coverImage || ""} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-serif font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">{article.title}</h4>
                                                <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-1 font-medium mt-1">{article.excerpt}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-20">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-8">Popular Searches</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {["Shadow Self", "Consciousness", "Stoicism", "Neuroscience", "Ego Death"].map(term => (
                                            <button
                                                key={term}
                                                onClick={() => setQuery(term)}
                                                className="px-6 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 hover:bg-blue-600 hover:text-white text-zinc-600 dark:text-zinc-400 font-bold text-sm transition-all"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[40px] p-10 flex flex-col justify-center border border-transparent dark:border-zinc-800">
                                    <h3 className="text-2xl font-serif font-bold mb-4 italic text-zinc-900 dark:text-zinc-100">&quot;The truth will set you free, but first it will piss you off.&quot;</h3>
                                    <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">— Gloria Steinem</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ThemeToggle({ isScrolled }: { isScrolled: boolean }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
                "p-2 rounded-full transition-all active:scale-95 relative overflow-hidden group",
                isScrolled
                    ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                    : "hover:bg-white/10 text-white"
            )}
            title={`Toggle ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
            <AnimatePresence mode="wait">
                {theme === "dark" ? (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Moon size={20} className="text-blue-400" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Sun size={20} className="text-amber-500" />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}

export default Navbar;
