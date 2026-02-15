"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

interface JoinedArticle extends Doc<"articles"> {
    categoryName: string;
    authorName?: string;
    authorImage?: string;
}
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Settings, Bookmark, MessageSquare, Heart,
    LogOut, ChevronRight, Shield,
    Trash2, ExternalLink
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function UserDashboard() {
    const [activeTab, setActiveTab] = useState<"overview" | "bookmarks" | "settings">("overview");
    const [isUpdating, setIsUpdating] = useState(false);

    // Data fetching
    const user = useQuery(api.users.getMeFull);
    const bookmarkedArticles = useQuery(api.articles.getBookmarkedArticles);

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
        if (!confirm("Are you absolutely sure? This will permanently delete your account and all your data. This action cannot be undone.")) return;

        try {
            await deleteAccount();
            toast.success("Account deleted");
            signOut({ callbackUrl: "/" });
        } catch {
            toast.error("Failed to delete account");
        }
    };

    if (user === undefined) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-serif font-bold mb-4">You are not signed in</h1>
                    <Link href="/auth/signin" className="btn-gradient px-6 py-2 rounded-xl text-white font-bold">Sign In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <Navbar theme="dark" />

            <div className="pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-10">

                        {/* Sidebar Navigation */}
                        <div className="w-full lg:w-80 shrink-0">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100 sticky top-28">
                                <div className="flex items-center gap-4 mb-10 pb-10 border-b border-zinc-100">
                                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 border-2 border-white shadow-md">
                                        {user.profileImage ? (
                                            <Image src={user.profileImage} alt={user.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-50">
                                                <User size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-serif font-bold text-zinc-900 truncate">{user.name}</h2>
                                        <p className="text-xs text-zinc-500 font-medium truncate">{user.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <NavButton
                                        active={activeTab === "overview"}
                                        onClick={() => setActiveTab("overview")}
                                        icon={<Shield size={18} />}
                                        label="Overview"
                                    />
                                    <NavButton
                                        active={activeTab === "bookmarks"}
                                        onClick={() => setActiveTab("bookmarks")}
                                        icon={<Bookmark size={18} />}
                                        label="Bookmarks"
                                        count={user.stats.bookmarks}
                                    />
                                    <NavButton
                                        active={activeTab === "settings"}
                                        onClick={() => setActiveTab("settings")}
                                        icon={<Settings size={18} />}
                                        label="Settings"
                                    />
                                </div>

                                <div className="mt-10 pt-10 border-t border-zinc-100">
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
                                    >
                                        <LogOut size={18} />
                                        Sign Out
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
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <StatCard
                                                icon={<Bookmark size={24} />}
                                                label="Bookmarks"
                                                value={user.stats.bookmarks}
                                                color="text-sky-blue"
                                                bg="bg-sky-50"
                                            />
                                            <StatCard
                                                icon={<MessageSquare size={24} />}
                                                label="Comments"
                                                value={user.stats.comments}
                                                color="text-school-purple"
                                                bg="bg-purple-50"
                                            />
                                            <StatCard
                                                icon={<Heart size={24} />}
                                                label="Reactions"
                                                value={user.stats.reactions}
                                                color="text-pink-500"
                                                bg="bg-pink-50"
                                            />
                                        </div>

                                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-2xl font-serif font-bold text-zinc-900 italic">Recent Bookmarks</h3>
                                                <button
                                                    onClick={() => setActiveTab("bookmarks")}
                                                    className="text-primary font-bold text-xs uppercase tracking-widest hover:underline"
                                                >
                                                    View All
                                                </button>
                                            </div>

                                            {bookmarkedArticles && bookmarkedArticles.length > 0 ? (
                                                <div className="space-y-4">
                                                    {bookmarkedArticles.slice(0, 3).map((article: JoinedArticle) => (
                                                        <Link
                                                            key={article._id}
                                                            href={`/articles/${article.slug}`}
                                                            className="flex items-center gap-6 p-4 rounded-2xl border border-zinc-50 hover:border-primary/20 hover:bg-primary/5 transition-all group"
                                                        >
                                                            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                                                                <Image src={article.coverImage || ""} alt={article.title} fill className="object-cover" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-bold text-zinc-900 group-hover:text-primary transition-colors truncate">{article.title}</h4>
                                                                <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-widest">{article.categoryName}</p>
                                                            </div>
                                                            <ChevronRight size={18} className="text-zinc-300 group-hover:text-primary transition-colors" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center text-zinc-400">
                                                    <Bookmark size={48} className="mx-auto mb-4 opacity-10" />
                                                    <p className="font-medium italic">No bookmarks yet</p>
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
                                        className="space-y-8"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-3xl font-serif font-bold text-zinc-900 italic">Saved Truths</h3>
                                            <p className="text-sm font-bold text-primary px-4 py-1.5 bg-primary/5 rounded-full">{bookmarkedArticles?.length || 0} Articles</p>
                                        </div>

                                        <div className="grid gap-6">
                                            {bookmarkedArticles && bookmarkedArticles.length > 0 ? (
                                                bookmarkedArticles.map((article: JoinedArticle) => (
                                                    <div
                                                        key={article._id}
                                                        className="group bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6"
                                                    >
                                                        <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 bg-zinc-100">
                                                            {article.coverImage && (
                                                                <Image src={article.coverImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col py-1">
                                                            <Link href={`/articles/${article.slug}`}>
                                                                <h4 className="text-lg font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1 mb-2">{article.title}</h4>
                                                            </Link>
                                                            <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 mb-4">
                                                                <span className="text-primary/70 uppercase tracking-widest">{article.categoryName}</span>
                                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-200" />
                                                                <span>{article.readingTime}m read</span>
                                                            </div>
                                                            <div className="mt-auto flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-zinc-100 relative overflow-hidden">
                                                                        {article.authorImage && <Image src={article.authorImage} alt={article.authorName || "Author"} fill className="object-cover" />}
                                                                    </div>
                                                                    <span className="text-xs font-bold text-zinc-500">{article.authorName || "Unknown Author"}</span>
                                                                </div>
                                                                <Link
                                                                    href={`/articles/${article.slug}`}
                                                                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary hover:tracking-[0.2em] transition-all"
                                                                >
                                                                    Read Now <ExternalLink size={14} />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-white rounded-[2.5rem] p-20 text-center border border-zinc-100 shadow-sm">
                                                    <Bookmark size={48} className="mx-auto mb-6 text-zinc-200" />
                                                    <h3 className="text-xl font-bold text-zinc-900 mb-2">No articles yet</h3>
                                                    <p className="text-zinc-500 mb-8 max-w-sm mx-auto">This author hasn&apos;t published any articles yet.</p>
                                                    <Link href="/articles" className="btn-gradient px-8 py-3 rounded-2xl text-white font-bold shadow-lg shadow-primary/20">Explore Articles</Link>
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
                                        className="space-y-8"
                                    >
                                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-zinc-200/50 border border-zinc-100">
                                            <h3 className="text-2xl font-serif font-bold text-zinc-900 italic mb-8">Account Settings</h3>

                                            <form onSubmit={handleUpdateProfile} className="space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Full Name</label>
                                                        <input
                                                            name="name"
                                                            defaultValue={user.name}
                                                            placeholder="Your Name"
                                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-zinc-900"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
                                                        <div className="relative">
                                                            <input
                                                                disabled
                                                                defaultValue={user.email}
                                                                className="w-full px-6 py-4 bg-zinc-100 border border-zinc-200 rounded-2xl text-zinc-400 font-medium cursor-not-allowed"
                                                            />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                <div className="px-2 py-1 bg-zinc-200 rounded-md text-[8px] font-black uppercase text-zinc-500 tracking-tighter">Verified</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4">
                                                    <button
                                                        type="submit"
                                                        disabled={isUpdating}
                                                        className="px-10 py-4 btn-gradient rounded-2xl text-white font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        {isUpdating ? "Saving..." : "Update Settings"}
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-16 pt-16 border-t border-red-50">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="space-y-1">
                                                        <h4 className="text-lg font-bold text-red-600">Danger Zone</h4>
                                                        <p className="text-sm text-zinc-500 max-w-md">Once you delete your account, there is no going back. Please be certain.</p>
                                                    </div>
                                                    <button
                                                        onClick={handleDeleteAccount}
                                                        className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Trash2 size={18} />
                                                        Delete Account
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

            <Footer />
        </div>
    );
}

function NavButton({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count?: number }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-sm group",
                active
                    ? "bg-primary/5 text-primary border border-primary/10 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "transition-transform group-hover:scale-110",
                    active ? "text-primary" : "text-zinc-400 group-hover:text-zinc-600"
                )}>
                    {icon}
                </div>
                <span>{label}</span>
            </div>
            {count !== undefined && (
                <span className={cn(
                    "px-2 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest",
                    active ? "bg-primary/20 text-primary" : "bg-zinc-100 text-zinc-400"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode, label: string, value: number, color: string, bg: string }) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-inner", color, bg)}>
                {icon}
            </div>
            <div className="text-2xl font-serif font-black text-zinc-900 mb-1">{value}</div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">{label}</div>
        </div>
    );
}
