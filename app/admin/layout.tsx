"use client";

import Link from "next/link";
import {
    LayoutDashboard,
    FileText,
    FolderTree,
    Users,
    LogOut,
    Sparkles,
    MessageSquare,
    Bot,
    Menu,
    X,
    ArrowLeft,
    BarChart3,
    Mail
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Articles", href: "/admin/articles", icon: FileText },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "AI Drafts", href: "/admin/ai-drafts", icon: Sparkles },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Moderation", href: "/admin/comments", icon: MessageSquare },
    { name: "Emails", href: "/admin/emails", icon: Mail },
    { name: "AI Settings", href: "/admin/settings/ai", icon: Bot },
];

const NavContent = ({
    pathname,
    onClose
}: {
    pathname: string;
    onClose?: () => void
}) => (
    <>
        <div className="p-6">
            <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                    TP
                </div>
                <div>
                    <span className="font-serif text-lg font-bold block leading-none">The Truth Pill</span>
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Admin Control</span>
                </div>
            </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pt-4">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold uppercase tracking-wide transition-all duration-300",
                            isActive
                                ? "bg-zinc-900 text-white shadow-md shadow-zinc-200"
                                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        )}
                    >
                        <item.icon size={18} className={cn(isActive ? "text-white" : "text-zinc-400")} />
                        {item.name}
                    </Link>
                );
            })}
        </nav>

        <div className="p-4 mt-auto space-y-2 border-t border-zinc-50">
            <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Website
            </Link>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 w-full transition-colors">
                <LogOut size={16} />
                Logout
            </button>
        </div>
    </>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex min-h-screen bg-zinc-50/50">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 bg-white border-r border-zinc-200/50 flex-col fixed inset-y-0 z-40">
                <NavContent pathname={pathname} />
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 px-4 flex items-center justify-between z-30">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-black text-sm">TP</div>
                    <span className="font-serif font-bold">Admin</span>
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                    <Menu size={24} />
                </button>
            </header>

            {/* Mobile Navigation Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMenu}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-[280px] bg-white z-[60] lg:hidden flex flex-col shadow-2xl"
                        >
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={closeMenu}
                                    className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <NavContent pathname={pathname} onClose={closeMenu} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 min-h-screen pt-20 lg:pt-8 p-4 md:p-8 transition-all duration-500">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
