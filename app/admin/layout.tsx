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
    Mail,
    Megaphone,
    Settings
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

const NAV_GROUPS = [
    {
        label: "General",
        items: [
            { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
            { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        ]
    },
    {
        label: "Content",
        items: [
            { name: "Articles", href: "/admin/articles", icon: FileText },
            { name: "AI Drafts", href: "/admin/ai-drafts", icon: Sparkles },
            { name: "Categories", href: "/admin/categories", icon: FolderTree },
        ]
    },
    {
        label: "Community",
        items: [
            { name: "Users", href: "/admin/users", icon: Users },
            { name: "Moderation", href: "/admin/comments", icon: MessageSquare },
            { name: "Emails", href: "/admin/emails", icon: Mail },
        ]
    },
    {
        label: "Advertising",
        items: [
            { name: "Ads Management", href: "/admin/ads", icon: Megaphone },
        ]
    },
    {
        label: "Settings",
        items: [
            { name: "Site Settings", href: "/admin/settings", icon: Settings },
            { name: "AI Settings", href: "/admin/settings/ai", icon: Bot },
        ]
    },
];

const NavContent = ({
    pathname,
    onClose,
    isCollapsed
}: {
    pathname: string;
    onClose?: () => void;
    isCollapsed: boolean;
}) => (
    <>
        <div className={cn("p-6", isCollapsed && "px-4 overflow-hidden")}>
            <Link href="/" className="flex items-center gap-3 group">
                {isCollapsed ? (
                    <Image
                        src="/truthpill/logo-icon.png"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                    />
                ) : (
                    <div className="relative h-10 w-full min-w-[160px]">
                        <Image
                            src="/truthpill/logo-text-hor-dark.png"
                            alt="The Truth Pill"
                            fill
                            className="object-contain hidden dark:block"
                            priority
                        />
                        <Image
                            src="/truthpill/logo-text-hor-light.png"
                            alt="The Truth Pill"
                            fill
                            className="object-contain dark:hidden "
                            priority
                        />
                    </div>
                )}
            </Link>
        </div>

        <nav
            data-lenis-prevent
            className="flex-1 px-3 space-y-6 overflow-y-auto pt-4 font-sans uppercase tracking-wider text-xs font-bold min-h-0"
        >
            {NAV_GROUPS.map((group) => (
                <div key={group.label} className="space-y-1">
                    {!isCollapsed && (
                        <h3 className="px-4 text-[10px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-[0.2em] mb-3">
                            {group.label}
                        </h3>
                    )}
                    {group.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full"
                                    />
                                )}
                                <item.icon
                                    size={20}
                                    className={cn(
                                        "flex-shrink-0 transition-colors",
                                        isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white"
                                    )}
                                />
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {item.name}
                                    </motion.span>
                                )}

                                {isCollapsed && (
                                    <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>

        <div className="p-4 mt-auto space-y-2 border-t border-gray-100 dark:border-gray-900">
            <Link
                href="/"
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors",
                    isCollapsed && "justify-center px-0"
                )}
            >
                <ArrowLeft size={16} />
                {!isCollapsed && <span>Back to Website</span>}
            </Link>
            <button className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors",
                isCollapsed && "justify-center px-0"
            )}>
                <LogOut size={16} />
                {!isCollapsed && <span>Logout</span>}
            </button>
        </div>
    </>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-400">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:flex bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-900 flex-col fixed inset-y-0 z-40 transition-all duration-300",
                    isCollapsed ? "w-20" : "w-[260px]"
                )}
            >
                <NavContent pathname={pathname} isCollapsed={isCollapsed} />

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900 shadow-sm transition-all z-50"
                >
                    <Menu size={12} className={cn("transition-transform", isCollapsed ? "rotate-180" : "rotate-0")} />
                </button>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-900 px-4 flex items-center justify-between z-30">
                <Link href="/" className="flex items-center gap-2">
                    <div className="relative h-8 w-32">
                        <Image
                            src="/truthpill/logo-text-hor-dark.png"
                            alt="The Truth Pill"
                            fill
                            className="object-contain dark:hidden"
                        />
                        <Image
                            src="/truthpill/logo-text-hor-light.png"
                            alt="The Truth Pill"
                            fill
                            className="object-contain hidden dark:block"
                        />
                    </div>
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition-colors"
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
                            className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-gray-950 z-[60] lg:hidden flex flex-col shadow-2xl"
                        >
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={closeMenu}
                                    className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <NavContent pathname={pathname} onClose={closeMenu} isCollapsed={false} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300 min-h-screen pt-20 lg:pt-8 p-4 md:p-8",
                    isCollapsed ? "lg:ml-20" : "lg:ml-[260px]"
                )}
            >
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
