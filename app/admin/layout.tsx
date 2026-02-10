"use client";

import Link from "next/link";
import {
    LayoutDashboard,
    FileText,
    FolderTree,
    Users,
    Bell,
    Settings,
    Mail,
    LogOut,
    Sparkles
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Articles", href: "/admin/articles", icon: FileText },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "AI Drafts", href: "/admin/ai-drafts", icon: Sparkles },
    { name: "Community", href: "/admin/community", icon: Users },
    { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-zinc-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col fixed inset-y-0">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">T</div>
                        <span className="font-serif text-xl font-bold">Admin Portal</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/5 text-primary"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                )}
                            >
                                <item.icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-100">
                    <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
