"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Settings, Bookmark, MessageSquare, Heart,
    LogOut, ChevronRight, Shield,
    Trash2, ExternalLink, Activity, Loader2, Sparkles,
    ArrowRight, Clock, Sun, Moon
} from "lucide-react";
import { useTheme } from "next-themes";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface JoinedArticle extends Doc<"articles"> {
    categoryName: string;
    authorName?: string;
    authorImage?: string;
}

export default function UserDashboard() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState<"overview" | "bookmarks" | "settings">("overview");
    const [isUpdating, setIsUpdating] = useState(false);

    // Data fetching
    const user = useQuery(api.users.getMeFullSecure, {
        email: session?.user?.email ?? ""
    });
    const bookmarkedArticles = useQuery(api.articles.getBookmarkedArticles, {
        email: session?.user?.email ?? ""
    });

    // Mutations
    const updateProfile = useMutation(api.users.updateProfile);
    const deleteAccount = useMutation(api.users.deleteAccount);

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUpdating(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;

        try {
            await updateProfile({ name });
            toast.success("Profile updated successfully");
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        toast("Permanently delete your entire digital footprint?", {
            action: {
                label: "Confirm Deletion",
                onClick: async () => {
                    try {
                        await deleteAccount();
                        toast.success("Account deleted");
                        signOut({ callbackUrl: "/" });
                    } catch {
                        toast.error("Failed to delete account");
                    }
                }
            }
        });
    };

    // Loading State
    if (status === "loading" || (status === "authenticated" && (user === undefined || bookmarkedArticles === undefined))) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-500">
                <div className="flex flex-col items-center gap-4 text-blue-600 dark:text-blue-500">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium font-sans">Synchronizing your profile...</p>
                </div>
            </div>
        );
    }

    // Not Signed In
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6 transition-colors duration-500">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 p-10 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl text-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-6">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-3xl font-serif font-black text-gray-950 dark:text-white mb-3">Authorized Personnel Only</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Please sign in to access your personal archives and settings.</p>
                    <Link href="/auth/signin" className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 px-8 py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-95">
                        Initiate Login <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-950 dark:text-gray-100 transition-colors duration-500">
            <Navbar theme="dark" />

            <div className="pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-12">

                        {/* Sidebar Navigation */}
                        <div className="w-full lg:w-80 shrink-0">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-800 sticky top-32">
                                <div className="flex items-center gap-4 mb-10 pb-10 border-b border-gray-100 dark:border-gray-800">
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-transform hover:scale-105 duration-500">
                                        {user.profileImage ? (
                                            <Image src={user.profileImage} alt={user.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                                <User size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-serif font-black text-gray-950 dark:text-white truncate leading-tight">{user.name}</h2>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest truncate mt-1">{user.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <NavButton
                                        active={activeTab === "overview"}
                                        onClick={() => setActiveTab("overview")}
                                        icon={<Activity size={18} />}
                                        label="Activity"
                                    />
                                    <NavButton
                                        active={activeTab === "bookmarks"}
                                        onClick={() => setActiveTab("bookmarks")}
                                        icon={<Bookmark size={18} />}
                                        label="My Library"
                                        count={user.stats.bookmarks}
                                    />
                                    <NavButton
                                        active={activeTab === "settings"}
                                        onClick={() => setActiveTab("settings")}
                                        icon={<Settings size={18} />}
                                        label="Edit Profile"
                                    />
                                </div>

                                <div className="mt-10 pt-10 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold uppercase text-[10px] tracking-widest border border-transparent hover:border-red-100 dark:hover:border-red-500/20 shadow-sm"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 min-w-0">
                            <AnimatePresence mode="wait">
                                {activeTab === "overview" && (
                                    <motion.div
                                        key="overview"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-10"
                                    >
                                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 md:p-12 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-80 h-80 opacity-40 dark:opacity-60 translate-x-10 -translate-y-10 group-hover:scale-105 transition-transform duration-700 pointer-events-none">
                                                <Image
                                                    src="/illustrations/Welcome.svg"
                                                    alt=""
                                                    fill
                                                    className="object-contain dark:invert dark:hue-rotate-180 dark:brightness-200 transition-all"
                                                />
                                            </div>
                                            <div className="relative z-10">
                                                <h2 className="text-4xl md:text-5xl font-serif font-black text-gray-950 dark:text-white tracking-tight italic mb-4">
                                                    Welcome back, <span className="text-blue-600 dark:text-blue-400">{user.name.split(" ")[0]}!</span>
                                                </h2>
                                                <p className="text-gray-500 dark:text-gray-400 font-medium max-w-md text-lg leading-relaxed">
                                                    It&apos;s a wonderful day to learn something new about the world and yourself.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <StatCard
                                                icon={<Bookmark size={24} />}
                                                label="Read Later"
                                                value={user.stats.bookmarks}
                                                color="blue"
                                            />
                                            <StatCard
                                                icon={<MessageSquare size={24} />}
                                                label="Comments"
                                                value={user.stats.comments}
                                                color="purple"
                                            />
                                            <StatCard
                                                icon={<Heart size={24} />}
                                                label="Likes"
                                                value={user.stats.reactions}
                                                color="cyan"
                                            />
                                        </div>

                                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-800 shadow-sm">
                                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50 dark:border-gray-800">
                                                <div>
                                                    <h3 className="text-2xl font-serif font-black text-gray-950 dark:text-white tracking-tight italic flex items-center gap-3">
                                                        Read Later
                                                        <Sparkles size={20} className="text-blue-500" />
                                                    </h3>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">Articles you have saved to your collection</p>
                                                </div>
                                                <button
                                                    onClick={() => setActiveTab("bookmarks")}
                                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>

                                            {bookmarkedArticles && bookmarkedArticles.length > 0 ? (
                                                <div className="space-y-4">
                                                    {bookmarkedArticles.slice(0, 3).map((article: JoinedArticle) => (
                                                        <Link
                                                            key={article._id}
                                                            href={`/articles/${article.slug}`}
                                                            className="flex items-center gap-6 p-5 rounded-xl border border-gray-50 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all duration-300 group"
                                                        >
                                                            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800 shadow-sm">
                                                                <Image src={article.coverImage || ""} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-serif font-black text-gray-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate text-lg tracking-tight">{article.title}</h4>
                                                                <div className="flex items-center gap-3 mt-1.5">
                                                                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900/50">{article.categoryName}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{article.readingTime}m Read</span>
                                                                </div>
                                                            </div>
                                                            <ChevronRight size={20} className="text-gray-300 dark:text-gray-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-16 text-center">
                                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-200 dark:text-gray-700 mx-auto mb-4 border border-dashed border-gray-200 dark:border-gray-700">
                                                        <Bookmark size={32} />
                                                    </div>
                                                    <p className="text-gray-400 dark:text-gray-500 font-black uppercase text-[10px] tracking-[0.2em]">Silence in the archives</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "bookmarks" && (
                                    <motion.div
                                        key="bookmarks"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-10"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-3xl font-serif font-black text-gray-950 dark:text-white tracking-tight italic">My Library</h3>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">A collection of things you want to remember</p>
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/50 px-4 py-2 rounded-xl">
                                                {bookmarkedArticles?.length || 0} Entities
                                            </div>
                                        </div>

                                        <div className="grid gap-6">
                                            {bookmarkedArticles && bookmarkedArticles.length > 0 ? (
                                                bookmarkedArticles.map((article: JoinedArticle) => (
                                                    <div
                                                        key={article._id}
                                                        className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col md:flex-row gap-8"
                                                    >
                                                        <div className="relative w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                                                            {article.coverImage && (
                                                                <Image src={article.coverImage} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col py-1">
                                                            <div className="mb-4">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{article.categoryName}</span>
                                                                <Link href={`/articles/${article.slug}`}>
                                                                    <h4 className="text-xl font-serif font-black text-gray-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mt-1 tracking-tight">{article.title}</h4>
                                                                </Link>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">
                                                                <span className="flex items-center gap-1.5"><Clock size={12} className="text-blue-500" /> {article.readingTime}m Read</span>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800" />
                                                                <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-purple-500" /> Verified</span>
                                                            </div>
                                                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 relative overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                                                                        {article.authorImage && <Image src={article.authorImage} alt={article.authorName || "Author"} fill className="object-cover" />}
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{article.authorName || "Central Bureau"}</span>
                                                                </div>
                                                                <Link
                                                                    href={`/articles/${article.slug}`}
                                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-all"
                                                                >
                                                                    Access Portal <ExternalLink size={14} />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-16 md:p-24 text-center border border-gray-200 dark:border-gray-800 shadow-sm group">
                                                    <div className="w-64 h-64 mx-auto mb-10 opacity-100 relative group-hover:scale-105 transition-transform duration-700">
                                                        <Image
                                                            src="/illustrations/Empty-inbox.svg"
                                                            alt=""
                                                            fill
                                                            className="object-contain dark:invert dark:hue-rotate-180 dark:brightness-200"
                                                        />
                                                    </div>
                                                    <h3 className="text-3xl font-serif font-black text-gray-950 dark:text-white mb-4 italic">No Saved Entities</h3>
                                                    <p className="text-gray-500 dark:text-gray-400 mb-12 max-w-sm mx-auto font-medium text-lg">Your personal archives are currently empty. Explore the collective knowledge to find something worth keeping.</p>
                                                    <Link href="/articles" className="inline-flex items-center gap-3 bg-blue-600 px-12 py-5 rounded-xl text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700">
                                                        Browse the Article <ArrowRight size={16} />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "settings" && (
                                    <motion.div
                                        key="settings"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-10"
                                    >
                                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 md:p-12 border border-gray-200 dark:border-gray-800 shadow-sm">
                                            <div className="mb-12">
                                                <h3 className="text-3xl font-serif font-black text-gray-950 dark:text-white tracking-tight italic">Account Settings</h3>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">Change your name and manage your account</p>
                                            </div>

                                            <form onSubmit={handleUpdateProfile} className="space-y-10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Your Name</label>
                                                        <input
                                                            name="name"
                                                            defaultValue={user.name}
                                                            placeholder="Enter your name"
                                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Email Address</label>
                                                        <div className="relative">
                                                            <input
                                                                disabled
                                                                defaultValue={user.email}
                                                                className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-600 font-bold cursor-not-allowed"
                                                            />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                <div className="px-2 py-1 bg-green-50 dark:bg-green-500/10 rounded-lg text-[8px] font-black uppercase text-green-600 dark:text-green-400 tracking-tighter border border-green-100 dark:border-green-900/50">Verified</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4">
                                                    <button
                                                        type="submit"
                                                        disabled={isUpdating}
                                                        className="px-10 py-4 bg-blue-600 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 hover:bg-blue-700 hover:shadow-blue-500/40"
                                                    >
                                                        {isUpdating ? "Saving..." : "Save Changes"}
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-16 pt-12 border-t border-gray-100 dark:border-gray-800">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2">
                                                    Appearance Controls
                                                    <span className="w-8 h-px bg-gray-100 dark:bg-gray-800" />
                                                </h4>
                                                <ThemeSwitcher />
                                            </div>

                                            <div className="mt-20 pt-16 border-t border-red-50 dark:border-red-950/30">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 bg-red-50/30 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-900/20">
                                                    <div className="space-y-1.5">
                                                        <h4 className="text-lg font-serif font-black text-red-600 dark:text-red-500 tracking-tight">Delete Account</h4>
                                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest max-w-sm">This will permanently delete your account and all your saved articles.</p>
                                                    </div>
                                                    <button
                                                        onClick={handleDeleteAccount}
                                                        className="px-8 py-4 bg-white dark:bg-gray-950 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                                    >
                                                        <Trash2 size={16} />
                                                        Yes, delete anyway
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavButton({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count?: number }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest group border outline-none",
                active
                    ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500 shadow-lg shadow-blue-500/20"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "transition-transform duration-500 group-hover:scale-110 group-active:scale-90",
                    active ? "text-white" : "text-gray-300 group-hover:text-blue-600"
                )}>
                    {icon}
                </div>
                <span>{label}</span>
            </div>
            {count !== undefined && (
                <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black transition-colors",
                    active ? "bg-white/20 text-white" : "bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: "blue" | "purple" | "cyan" }) {
    const variants = {
        blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-900/50",
        purple: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-900/50",
        cyan: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-900/50"
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-500 group hover:-translate-y-1">
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-sm border transition-transform duration-500 group-hover:rotate-6", variants[color])}>
                {icon}
            </div>
            <div className="text-4xl font-serif font-black text-gray-950 dark:text-white mb-1.5 leading-none tracking-tight transition-colors">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 group-hover:text-gray-950 dark:group-hover:text-white transition-colors">{label}</div>
        </div>
    );
}

function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    if (!mounted) return <div className="h-14 w-full bg-gray-50 dark:bg-gray-800 animate-pulse rounded-xl" />;

    return (
        <div className="grid grid-cols-2 gap-4">
            <button
                onClick={() => setTheme("light")}
                className={cn(
                    "flex items-center justify-center gap-3 p-4 rounded-xl border transition-all",
                    theme === "light"
                        ? "bg-white border-blue-200 text-blue-600 shadow-sm"
                        : "bg-gray-50 dark:bg-gray-800 border-transparent text-gray-400 hover:text-gray-600"
                )}
            >
                <Sun size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Light Mode</span>
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={cn(
                    "flex items-center justify-center gap-3 p-4 rounded-xl border transition-all",
                    theme === "dark"
                        ? "bg-gray-900 border-blue-900 text-blue-400 shadow-sm"
                        : "bg-gray-50 dark:bg-gray-800 border-transparent text-gray-400 hover:text-gray-300"
                )}
            >
                <Moon size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Dark Mode</span>
            </button>
        </div>
    );
}
